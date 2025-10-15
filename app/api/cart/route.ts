import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/cart - list cart items for current user
export async function GET() {
  const session = await auth();
  if (!session) return new NextResponse("UNAUTHORIZED", { status: 401 });
  const userId = (session.user as { id?: string }).id as string;
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}

// POST /api/cart - add product (or increment quantity) to cart
// Body: { productId: string, quantity?: number, replace?: boolean }
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new NextResponse("UNAUTHORIZED", { status: 401 });
  try {
    const body = await req.json();
    const Schema = z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive().default(1).optional(),
      replace: z.boolean().optional(),
    });
  const { productId } = Schema.parse(body);
    const userId = (session.user as { id?: string }).id as string;

    if (!userId) {
      return NextResponse.json({ error: "User id missing in session" }, { status: 400 });
    }

    // Ensure user exists (helps when DB was reset but session cookie persisted)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found. Please sign in again." }, { status: 401 });
    }

    // Ensure product exists & active
    const product = await prisma.templateProduct.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found or inactive", productId, userId, found: !!product, isActive: product?.isActive }, { status: 404 });
    }

    // Upsert logic (enforce max quantity = 1)
    const existing = await prisma.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!existing) {
      const item = await prisma.cartItem.create({ data: { userId, productId, quantity: 1 } });
      return NextResponse.json(item, { status: 201 });
    } else {
      if (existing.quantity !== 1) {
        const item = await prisma.cartItem.update({
          where: { userId_productId: { userId, productId } },
          data: { quantity: 1 },
        });
        return NextResponse.json(item, { status: 200 });
      }
      return NextResponse.json(existing, { status: 200 });
    }
  } catch (err: unknown) {
  if ((err as { issues?: unknown }).issues) return NextResponse.json({ error: "Invalid input", details: (err as { issues?: unknown }).issues }, { status: 400 });
    // Prisma known errors
    if ((err as { code?: string }).code === 'P2003') {
      const e = err as { code?: string; meta?: unknown };
      return NextResponse.json({ error: 'Foreign key constraint failed (check productId and userId)', code: e.code, meta: e.meta }, { status: 400 });
    }
    if ((err as { code?: string }).code === 'P2002') {
      // uniqueness (shouldn't happen here except race condition)
      return NextResponse.json({ error: 'Duplicate cart item', code: (err as { code?: string }).code }, { status: 409 });
    }
    console.error("[cart.post] unexpected", {
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
      code: (err as { code?: string }).code,
    });
    return NextResponse.json({ error: "Internal Server Error", message: (err as Error)?.message, code: (err as { code?: string }).code }, { status: 500 });
  }
}
