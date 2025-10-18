import Midtrans from "midtrans-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Validate environment variables (server-only)
        const serverKey = process.env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SECRET || process.env.NEXT_PUBLIC_SECRET;
        const clientKey = process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_CLIENT;
        if (!serverKey) {
            return NextResponse.json({ error: "Missing MIDTRANS_SERVER_KEY" }, { status: 500 });
        }
        if (!clientKey) {
            return NextResponse.json({ error: "Missing MIDTRANS_CLIENT_KEY" }, { status: 500 });
        }

        // Initialize Midtrans Snap
        const isProduction = (process.env.MIDTRANS_IS_PRODUCTION === 'true');
        const snap = new Midtrans.Snap({
            isProduction,
            serverKey,
            clientKey,
        });

        const { id, productName, price, quantity } = await request.json();

        // Validate input
        if (!id || !productName || !price || !quantity) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const items = [
            {
                id: String(id),
                price: Number(price),
                quantity: Number(quantity),
                name: String(productName),
            },
            {
                id: "topup",
                price: 100000,
                quantity: 1,
                name: "Top Up Balance",
            }
        ];

        // Ensure gross_amount equals the sum of (price * quantity) for all items
        const grossAmount = items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);

        const parameter = {
            item_details: items,
            transaction_details: {
                order_id: `ORDER-${id}-${Date.now()}`,
                gross_amount: grossAmount,
            },
            customer_details: {
                first_name: "Customer",
                email: "customer@example.com",
            },
        };

        const transaction = await snap.createTransaction(parameter);
        console.log("Transaction created:", transaction);
        
        return NextResponse.json({ token: transaction.token });
    } catch (error) {
        console.error("Midtrans API Error:", error);
        return NextResponse.json(
            { error: "Failed to create transaction", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}