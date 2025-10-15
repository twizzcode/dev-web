import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth().catch(() => null);
  if (!session) return new NextResponse("UNAUTHORIZED", { status: 401 });
  const userId = (session.user as { id?: string })?.id as string;

  // Check ownership
  const own = await prisma.templateOwnership.findUnique({
    where: { userId_productId: { userId, productId: params.id } },
  });
  if (!own) return new NextResponse("FORBIDDEN", { status: 403 });

  const product = await prisma.templateProduct.findUnique({ where: { id: params.id } });
  const ownerLink = (product as { ownerLink?: string | null } | null)?.ownerLink ?? null;
  return NextResponse.json({ ownerLink });
}
