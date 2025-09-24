import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = typeof body.kind === "string" ? body.kind : undefined;
    const context = typeof body.context === "string" ? body.context : undefined;
    const userId = typeof body.userId === "string" ? body.userId : undefined;
    if (!kind) {
      return NextResponse.json({ success: false, error: "Missing kind" }, { status: 400 });
    }
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || undefined;
  const ev = await prisma.analyticsEvent.create({ data: { kind, context, userId, ip } });
    return NextResponse.json({ success: true, id: ev.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
