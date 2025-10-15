import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Midtrans from "midtrans-client";

type MidtransNotification = {
  transaction_status: string;
  payment_type?: string;
  order_id: string;
  fraud_status?: string;
  status_code?: string;
  gross_amount?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as MidtransNotification;
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: order_id }, include: { items: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Map Midtrans status to our OrderStatus
    let newStatus: 'PAID' | 'PENDING' | 'EXPIRED' | 'CANCELED' | null = null;
    switch (transaction_status) {
      case 'capture':
        newStatus = fraud_status === 'challenge' ? 'PENDING' : 'PAID';
        break;
      case 'settlement':
        newStatus = 'PAID';
        break;
      case 'pending':
        newStatus = 'PENDING';
        break;
      case 'deny':
      case 'cancel':
        newStatus = 'CANCELED';
        break;
      case 'expire':
        newStatus = 'EXPIRED';
        break;
      default:
        newStatus = null;
    }

    if (!newStatus) return NextResponse.json({ ok: true });

    // Update order status
    await prisma.order.update({ where: { id: order.id }, data: { status: newStatus } });

    if (newStatus === 'PAID') {
      // Grant ownership for each item (ensure unique)
      const ops = order.items.map(it => prisma.templateOwnership.upsert({
        where: { userId_productId: { userId: order.userId, productId: it.productId } },
        create: { userId: order.userId, productId: it.productId },
        update: {},
      }));
      // Increase soldCount
      const incs = order.items.map(it => prisma.templateProduct.update({
        where: { id: it.productId },
        data: { soldCount: { increment: it.quantity } },
      }));
      // Clear from cart
      const delCart = prisma.cartItem.deleteMany({ where: { userId: order.userId, productId: { in: order.items.map(i => i.productId) } } });
      await prisma.$transaction([...ops, ...incs, delCart]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[midtrans.notify]', err);
    return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 });
  }
}
