import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  try {
    const { id } = await params;
    const row = await prisma.templateCategory.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err: unknown) {
    console.error("[admin.categories.get]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  try {
    const json = await req.json();
    const Schema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().toLowerCase().regex(/^[a-z0-9_-]+$/).optional(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().url().optional().nullable(),
      color: z.string().optional().nullable(),
      position: z.number().int().nonnegative().optional(),
      isActive: z.boolean().optional(),
    });
    const data = Schema.parse(json);
    const { id } = await params;
    const row = await prisma.templateCategory.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    if (typeof err === 'object' && err !== null && 'issues' in err) {
      return NextResponse.json({ error: "Invalid input", details: (err as { issues: unknown }).issues }, { status: 400 });
    }
    console.error("[admin.categories.update]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  try {
    const { id } = await params;
    await prisma.templateCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // Category in use by products (FK constraint)
    if ((err as { code?: string }).code === "P2003") {
      return NextResponse.json({ error: "Cannot delete category in use by products" }, { status: 400 });
    }
    console.error("[admin.categories.delete]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
