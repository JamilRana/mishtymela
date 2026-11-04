import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  PublicShowcaseClient,
  ShowcaseProduct,
  ShowcaseShopInfo,
} from "@/components/showcase/PublicShowcaseClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Fetch organization details
  const org = await prisma.organization.findFirst();

  const shopInfo: ShowcaseShopInfo = {
    name: org?.name || "মিষ্টি মেলা",
    address: org?.address || "ত্রিশাল",
    phone: org?.phone || "01671578965",
    email: org?.email || "mishtymela@gmail.com",
    receiptFooter:
      org?.receiptFooter ||
      "মিষ্টি মেলা - স্বাদে ও ঐতিহ্যে অনন্য • সাথে থাকার জন্য ধন্যবাদ!",
  };

  // 2. Fetch active sellable sweets
  const rawProducts = await prisma.product.findMany({
    where: {
      isSellable: true,
      active: true,
      sku: { not: "DEMO-001" },
    },
    include: {
      category: true,
    },
    orderBy: [
      { categoryId: "asc" },
      { name: "asc" },
    ],
  });

  const products: ShowcaseProduct[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    imageUrl: p.imageUrl,
    sellingPrice: Number(p.sellingPrice),
    categoryName: p.category?.name ?? "Special Sweets",
    categoryId: p.categoryId,
    stockQty: Number(p.stockQty),
    inStock: Number(p.stockQty) > 0,
  }));

  // 3. Check if current visitor has an authenticated session (staff / owner)
  const session = await getSession();

  return (
    <main>
      <PublicShowcaseClient
        products={products}
        shopInfo={shopInfo}
        session={
          session
            ? {
                userId: session.userId,
                name: session.name,
                role: session.role,
              }
            : null
        }
      />
    </main>
  );
}
