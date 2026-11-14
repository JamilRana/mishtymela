import React from "react";
import { getContacts } from "@/actions/contacts";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactDirectory } from "@/components/contacts/ContactDirectory";
import { withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await withDbRetry(() => getContacts());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts & Directory"
        description="Manage customers, raw material suppliers, and employee profiles, credit dues, and salary ledger"
      />
      <ContactDirectory initialContacts={contacts} />
    </div>
  );
}
