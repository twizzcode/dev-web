import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import Midtrans from "midtrans-client";

// POST /api/checkout
// Body: { items?: { productId: string; quantity?: number }[] } (optional override; if not provided uses entire cart)
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new NextResponse("UNAUTHORIZED", { status: 401 });
  const userId = (session.user as any).id as string;
  try {
    const bodyRaw = await req.json().catch(() => ({}));
    const Schema = z.object({
      items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive().optional() })).optional(),
    });
    const { items } = Schema.parse(bodyRaw);

    // Load cart (or explicit items)
    let cartItems = await prisma.cartItem.findMany({ where: { userId }, include: { product: true } });
    if (items && items.length > 0) {
      // Filter / map
      const map = new Map(items.map(i => [i.productId, i.quantity || 1]));
      cartItems = cartItems.filter(ci => map.has(ci.productId)).map(ci => ({ ...ci, quantity: map.get(ci.productId)! }));
    }
    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Compute total + ensure all products active
    const activeFiltered = cartItems.filter(ci => ci.product.isActive);
    if (activeFiltered.length === 0) return NextResponse.json({ error: "No active products" }, { status: 400 });
    const gross = activeFiltered.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0);

    // Create order + items transactionally
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          grossAmount: gross,
        },
      });
      await tx.orderItem.createMany({
        data: activeFiltered.map(ci => ({
          orderId: created.id,
          productId: ci.productId,
          priceEach: ci.product.price,
          quantity: ci.quantity,
        })),
      });
      return created;
    });

    // Create Midtrans Snap transaction
    const serverKey = process.env.NEXT_PUBLIC_SECRET;
    const clientKey = process.env.NEXT_PUBLIC_CLIENT;
    if (!serverKey || !clientKey) {
      return NextResponse.json({ error: "Missing Midtrans configuration" }, { status: 500 });
    }
    const snap = new Midtrans.Snap({ isProduction: false, serverKey, clientKey });
    const parameter: any = {
      item_details: activeFiltered.map(ci => ({ id: ci.productId, price: ci.product.price, quantity: ci.quantity, name: ci.product.title })),
      transaction_details: { order_id: order.id, gross_amount: gross },
      customer_details: { first_name: (session.user as any)?.name || 'Customer', email: (session.user as any)?.email || undefined },
    };
    const transaction = await snap.createTransaction(parameter);
    await prisma.order.update({ where: { id: order.id }, data: {
      midtransOrderId: order.id,
      midtransToken: (transaction as any).token ?? null,
      midtransRedirectUrl: (transaction as any).redirect_url ?? null,
      midtransPayload: transaction as any,
    }});

    return NextResponse.json({ orderId: order.id, redirectUrl: (transaction as any).redirect_url ?? null, token: (transaction as any).token ?? null }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 });
    console.error('[checkout.post]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
