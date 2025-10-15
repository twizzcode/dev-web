import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  const rows = await prisma.templateCategory.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  try {
    const json = await req.json();
    const Schema = z.object({
      name: z.string().min(1),
      slug: z.string().toLowerCase().regex(/^[a-z0-9_-]+$/),
      description: z.string().optional().nullable(),
      imageUrl: z.string().url().optional().nullable(),
      color: z.string().optional().nullable(),
      position: z.number().int().nonnegative().default(0),
      isActive: z.boolean().default(true),
    });
    const data = Schema.parse(json);
    const row = await prisma.templateCategory.create({ data });
    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    if ((err as { issues?: unknown }).issues) {
      return NextResponse.json({ error: "Invalid input", details: (err as { issues?: unknown }).issues }, { status: 400 });
    }
    console.error("[admin.categories.create]", err);
    if (process.env.NODE_ENV !== "production") {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
