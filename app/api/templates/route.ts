import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all"; // 'all' | category slug | 'owned'
  const take = Number(searchParams.get("take") || 60);

  if (filter === "owned") {
    const session = await auth().catch(() => null);
    if (!session) return new NextResponse("UNAUTHORIZED", { status: 401 });
  const userId = (session.user as { id?: string }).id as string;
    const owns = await prisma.templateOwnership.findMany({
      where: { userId },
      include: { product: { include: { category: true, links: { orderBy: { position: "asc" } } } } },
      orderBy: { createdAt: "desc" },
      take,
    });
  const rows = owns.map(o => o.product);
    const ids = rows.map(r => r.id);
    let buyersMap = new Map<string, number>();
    if (ids.length) {
      const groups = await prisma.templateOwnership.groupBy({
        by: ['productId'],
        _count: { productId: true },
        where: { productId: { in: ids } },
      });
      buyersMap = new Map(groups.map(g => [g.productId, g._count.productId] as const));
    }
    // Do not leak ownerLink in listings; add buyersCount derived from ownerships
  const sanitized = rows.map((p) => ({ ...p, ownerLink: undefined, buyersCount: buyersMap.get(p.id) ?? 0 }));
    return NextResponse.json(sanitized);
  }

  const where: Record<string, unknown> = { isActive: true };
  if (filter !== "all" && filter !== "basic") {
    where.category = { slug: filter };
  }

  const rows = await prisma.templateProduct.findMany({
    where,
    include: { category: true, links: { orderBy: { position: "asc" } } },
    orderBy: [{ createdAt: "desc" }],
    take,
  });

  // Strip ownerLink from general listing and annotate 'owned' if user is logged in
  const session = await auth().catch(() => null);
  let ownedIds = new Set<string>();
  if (session) {
    const userId = (session.user as { id?: string }).id as string;
    const ids = rows.map(r => r.id);
    if (ids.length) {
      const owns = await prisma.templateOwnership.findMany({ where: { userId, productId: { in: ids } }, select: { productId: true } });
      ownedIds = new Set(owns.map(o => o.productId));
    }
  }
  // buyersCount computed from ownership table
  let buyersMap = new Map<string, number>();
  const ids = rows.map(r => r.id);
  if (ids.length) {
    const groups = await prisma.templateOwnership.groupBy({
      by: ['productId'],
      _count: { productId: true },
      where: { productId: { in: ids } },
    });
    buyersMap = new Map(groups.map(g => [g.productId, g._count.productId] as const));
  }
  const sanitized = rows.map((p) => ({ ...p, ownerLink: undefined, owned: ownedIds.has(p.id), buyersCount: buyersMap.get(p.id) ?? 0 }));
  return NextResponse.json(sanitized);
}
