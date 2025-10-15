import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  const row = await prisma.templateProduct.findUnique({ where: { id: params.id }, include: { category: true, links: true } });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  try {
    const json = await req.json();
    const Schema = z.object({
      title: z.string().min(1).optional(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
      description: z.string().optional(),
      price: z.number().int().nonnegative().optional(),
      imageUrl: z.string().optional(),
      soldCount: z.number().int().nonnegative().optional(),
      isActive: z.boolean().optional(),
      categoryId: z.string().min(1).optional(),
      links: z
        .object({
          deleteMany: z.any().optional(),
          create: z
            .array(
              z.object({
                url: z.string().url(),
                label: z.string().nullable().optional(),
                position: z.number().int().optional(),
                mode: z.enum(["with_gap", "without_gap", "carousel"]).optional(),
              })
            )
            .min(1),
        })
        .optional(),
    });
    const data = Schema.parse(json);
    // Ensure updatedBy user exists; if not, omit to avoid FK errors
    const maybeUserId = (session.user as any)?.id as string | undefined;
    let updatedById: string | undefined = undefined;
    if (maybeUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: maybeUserId } });
      if (userExists) updatedById = maybeUserId;
    }
    const row = await prisma.templateProduct.update({ where: { id: params.id }, data: { ...data, updatedById } });
    return NextResponse.json(row);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    if (err?.code === "P2003") {
      const field = err?.meta?.field_name || err?.meta?.target || "reference";
      const message = `Invalid reference (${String(field)}). Check categoryId or updatedById.`;
      const body: any = { error: message };
      if (process.env.NODE_ENV !== "production" && err?.meta) body.meta = err.meta;
      return NextResponse.json(body, { status: 400 });
    }
    if (err?.issues) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    console.error("[admin.products.update]", err);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: "Internal Server Error", message: String(err?.message || err) }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  await prisma.templateProduct.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
