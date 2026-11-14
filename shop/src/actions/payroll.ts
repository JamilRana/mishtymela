"use server";

import { prisma, withDbRetry, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { assertPostingAllowed } from "@/modules/treasury/guard";

const GeneratePayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2050),
});

const UpdateAdjustmentSchema = z.object({
  id: z.string().min(1, "Record ID is required"),
  bonus: z.coerce.number().min(0).default(0),
  deduction: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

const DisburseSalarySchema = z.object({
  id: z.string().min(1, "Record ID is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  accountId: z.string().min(1, "Payment account is required"),
  paymentDate: z.string().default(() => new Date().toISOString()),
  notes: z.string().optional().nullable(),
});

const BatchDisburseSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2050),
  accountId: z.string().min(1, "Payment account is required"),
  paymentDate: z.string().default(() => new Date().toISOString()),
});

export async function getPayrollOverview(options?: {
  month?: number;
  year?: number;
  search?: string;
  status?: string;
}) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const now = new Date();
    const month = options?.month ?? now.getMonth() + 1;
    const year = options?.year ?? now.getFullYear();

    const where: any = {
      organizationId: orgId,
      month,
      year,
    };

    if (options?.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.employee = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { designation: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const [records, activeEmployeesCount, accounts] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        include: {
          employee: {
            select: { id: true, name: true, phone: true, designation: true },
          },
        },
        orderBy: [{ employee: { name: "asc" } }],
      }),
      prisma.contact.count({
        where: { organizationId: orgId, type: "EMPLOYEE", active: true },
      }),
      prisma.account.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true },
      }),
    ]);

    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    let totalPayable = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidStaffCount = 0;
    let unpaidStaffCount = 0;

    const formattedRecords = records.map((r) => {
      const netPayable = Number(r.netPayable);
      const paidAmount = Number(r.paidAmount);
      const pending = Math.max(0, netPayable - paidAmount);

      totalPayable += netPayable;
      totalPaid += paidAmount;
      totalPending += pending;

      if (r.status === "PAID") {
        paidStaffCount++;
      } else {
        unpaidStaffCount++;
      }

      return {
        id: r.id,
        contactId: r.contactId,
        employeeName: r.employee.name,
        employeePhone: r.employee.phone,
        designation: r.employee.designation ?? "কর্মী (Staff)",
        month: r.month,
        year: r.year,
        baseSalary: Number(r.baseSalary),
        bonus: Number(r.bonus),
        deduction: Number(r.deduction),
        netPayable,
        paidAmount,
        pendingAmount: pending,
        status: r.status,
        notes: r.notes,
        paymentDate: r.paymentDate?.toISOString() ?? null,
        accountId: r.accountId,
        accountName: r.accountId ? accountMap.get(r.accountId) ?? null : null,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return {
      month,
      year,
      records: formattedRecords,
      metrics: {
        totalPayable,
        totalPaid,
        totalPending,
        staffCount: records.length,
        activeEmployeesCount,
        paidStaffCount,
        unpaidStaffCount,
      },
    };
  });
}

export async function generateMonthlyPayrollAction(rawData: z.infer<typeof GeneratePayrollSchema>) {
  return handleAction("generateMonthlyPayrollAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const { month, year } = GeneratePayrollSchema.parse(rawData);

    const employees = await prisma.contact.findMany({
      where: { organizationId: orgId, type: "EMPLOYEE", active: true },
    });

    if (employees.length === 0) {
      throw new BusinessError("No active employees found in the Contacts directory.");
    }

    let createdCount = 0;

    for (const emp of employees) {
      const existing = await prisma.payrollRecord.findUnique({
        where: {
          organizationId_contactId_month_year: {
            organizationId: orgId,
            contactId: emp.id,
            month,
            year,
          },
        },
      });

      if (!existing) {
        const baseSalary = emp.monthlySalary ?? D(0);
        await prisma.payrollRecord.create({
          data: {
            organizationId: orgId,
            contactId: emp.id,
            month,
            year,
            baseSalary,
            bonus: 0,
            deduction: 0,
            netPayable: baseSalary,
            paidAmount: 0,
            status: "UNPAID",
            createdById: session.userId,
          },
        });
        createdCount++;
      }
    }

    revalidatePath("/payroll");
    return { createdCount, totalEmployees: employees.length };
  });
}

export async function updatePayrollAdjustmentAction(rawData: z.infer<typeof UpdateAdjustmentSchema>) {
  return handleAction("updatePayrollAdjustmentAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = UpdateAdjustmentSchema.parse(rawData);

    const record = await prisma.payrollRecord.findFirst({
      where: { id: validated.id, organizationId: orgId },
    });
    if (!record) throw new BusinessError("Payroll record not found");

    const baseSalary = D(record.baseSalary);
    const bonus = D(validated.bonus);
    const deduction = D(validated.deduction);
    const netPayable = baseSalary.plus(bonus).minus(deduction);

    if (netPayable.lt(0)) {
      throw new BusinessError("Net payable salary cannot be negative.");
    }

    const paidAmount = D(record.paidAmount);
    let status = record.status;
    if (paidAmount.gte(netPayable) && netPayable.gt(0)) {
      status = "PAID";
    } else if (paidAmount.gt(0)) {
      status = "PARTIAL";
    } else {
      status = "UNPAID";
    }

    const updated = await prisma.payrollRecord.update({
      where: { id: record.id },
      data: {
        bonus,
        deduction,
        netPayable,
        status,
        notes: validated.notes !== undefined ? validated.notes : record.notes,
      },
    });

    revalidatePath("/payroll");
    return {
      id: updated.id,
      netPayable: Number(updated.netPayable),
      status: updated.status,
    };
  });
}

export async function disburseSalaryAction(rawData: z.infer<typeof DisburseSalarySchema>) {
  return handleAction("disburseSalaryAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = DisburseSalarySchema.parse(rawData);

    const record = await prisma.payrollRecord.findFirst({
      where: { id: validated.id, organizationId: orgId },
      include: { employee: true },
    });
    if (!record) throw new BusinessError("Payroll record not found");

    const payDate = new Date(validated.paymentDate);
    await assertPostingAllowed(prisma as any, orgId, payDate);

    const payAmount = D(validated.amount);
    const currentlyPaid = D(record.paidAmount);
    const netPayable = D(record.netPayable);
    const maxPayable = netPayable.minus(currentlyPaid);

    if (payAmount.gt(maxPayable)) {
      throw new BusinessError(`Payment amount (৳${payAmount}) exceeds remaining payable (৳${maxPayable}).`);
    }

    const newPaidAmount = currentlyPaid.plus(payAmount);
    const newStatus = newPaidAmount.gte(netPayable) ? "PAID" : "PARTIAL";

    return await prisma.$transaction(async (tx) => {
      // 1. Expense Transaction in Treasury Account
      await tx.transaction.create({
        data: {
          organizationId: orgId,
          type: "EXPENSE",
          source: "PAYROLL",
          amount: payAmount,
          accountId: validated.accountId,
          description: `Salary: ${record.employee.name} (${record.month}/${record.year})${
            validated.notes ? ` - ${validated.notes}` : ""
          }`,
          occurredAt: payDate,
          createdById: session.userId,
        },
      });

      // 2. Audit in ContactLedger
      await tx.contactLedger.create({
        data: {
          organizationId: orgId,
          contactId: record.contactId,
          date: payDate,
          refType: "PAYROLL",
          refId: record.id,
          description: `Salary Payment (${record.month}/${record.year})`,
          debit: payAmount,
          credit: 0,
          balanceAfter: record.employee.currentDue,
          createdById: session.userId,
        },
      });

      // 3. Update Payroll Record
      const updated = await tx.payrollRecord.update({
        where: { id: record.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          accountId: validated.accountId,
          paymentDate: payDate,
          notes: validated.notes !== undefined ? validated.notes : record.notes,
        },
      });

      return {
        id: updated.id,
        paidAmount: Number(updated.paidAmount),
        status: updated.status,
      };
    }, TX_OPTIONS);
  });
}

export async function batchDisburseSalaryAction(rawData: z.infer<typeof BatchDisburseSchema>) {
  return handleAction("batchDisburseSalaryAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;
    const validated = BatchDisburseSchema.parse(rawData);

    const payDate = new Date(validated.paymentDate);
    await assertPostingAllowed(prisma as any, orgId, payDate);

    const pendingRecords = await prisma.payrollRecord.findMany({
      where: {
        organizationId: orgId,
        month: validated.month,
        year: validated.year,
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      include: { employee: true },
    });

    if (pendingRecords.length === 0) {
      throw new BusinessError("No pending salaries to disburse for this period.");
    }

    return await prisma.$transaction(async (tx) => {
      let totalDisbursed = D(0);
      let count = 0;

      for (const record of pendingRecords) {
        const netPayable = D(record.netPayable);
        const paidAmount = D(record.paidAmount);
        const amountToPay = netPayable.minus(paidAmount);

        if (amountToPay.gt(0)) {
          // Transaction
          await tx.transaction.create({
            data: {
              organizationId: orgId,
              type: "EXPENSE",
              source: "PAYROLL",
              amount: amountToPay,
              accountId: validated.accountId,
              description: `Batch Salary: ${record.employee.name} (${record.month}/${record.year})`,
              occurredAt: payDate,
              createdById: session.userId,
            },
          });

          // Contact Ledger
          await tx.contactLedger.create({
            data: {
              organizationId: orgId,
              contactId: record.contactId,
              date: payDate,
              refType: "PAYROLL",
              refId: record.id,
              description: `Batch Salary Payment (${record.month}/${record.year})`,
              debit: amountToPay,
              credit: 0,
              balanceAfter: record.employee.currentDue,
              createdById: session.userId,
            },
          });

          // Payroll Record
          await tx.payrollRecord.update({
            where: { id: record.id },
            data: {
              paidAmount: netPayable,
              status: "PAID",
              accountId: validated.accountId,
              paymentDate: payDate,
            },
          });

          totalDisbursed = totalDisbursed.plus(amountToPay);
          count++;
        }
      }

      return {
        disbursedStaffCount: count,
        totalDisbursed: Number(totalDisbursed),
      };
    }, TX_OPTIONS);
  });
}
