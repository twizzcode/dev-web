import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/cart/:id - remove cart item (only if belongs to user)
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return new NextResponse("UNAUTHORIZED", { status: 401 });
  const userId = (session.user as any).id as string;
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: params.id } });
    if (!item || item.userId !== userId) {
      return new NextResponse("NOT_FOUND", { status: 404 });
    }
    await prisma.cartItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cart.delete]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
