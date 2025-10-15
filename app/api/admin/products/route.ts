import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

function slugify(input: string) {
  const base = (input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || "product";
}

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  const rows = await prisma.templateProduct.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: { category: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") return new NextResponse("FORBIDDEN", { status: 403 });
  try {
    const json = await req.json();
    const Schema = z.object({
      title: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
      description: z.string().default(""),
      price: z.number().int().nonnegative(),
      imageUrl: z.string().min(1),
      soldCount: z.number().int().nonnegative().optional(),
      isActive: z.boolean().optional(),
      categoryId: z.string().min(1).optional(),
      categorySlug: z.string().min(1).optional(),
      links: z
        .object({
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
    // Resolve category by id or slug and ensure it exists
    let categoryId = data.categoryId;
    if (!categoryId && data.categorySlug) {
      const cat = await prisma.templateCategory.findUnique({ where: { slug: data.categorySlug } });
      if (!cat) return NextResponse.json({ error: "Category not found (by slug)" }, { status: 400 });
      categoryId = cat.id;
    }
    if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });
    const catCheck = await prisma.templateCategory.findUnique({ where: { id: categoryId } });
    if (!catCheck) return NextResponse.json({ error: "Category not found (by id)" }, { status: 400 });

    // Ensure createdBy user exists to avoid FK error; if not, omit tracking field
    const maybeUserId = (session.user as any)?.id as string | undefined;
    let createdById: string | undefined = undefined;
    if (maybeUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: maybeUserId } });
      if (userExists) createdById = maybeUserId;
    }

    // Determine slug (auto-generate from title if not provided) and ensure uniqueness
    let slug = data.slug ?? slugify(data.title);
    let attempt = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await prisma.templateProduct.findUnique({ where: { slug } });
      if (!exists) break;
      attempt += 1;
      slug = `${slugify(data.title)}-${attempt}`;
      if (attempt > 50) break; // safety
    }
    const row = await prisma.templateProduct.create({
      data: {
  title: data.title,
  slug,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        soldCount: data.soldCount ?? 0,
        isActive: data.isActive ?? true,
        categoryId,
        createdById,
        links: data.links,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    // Prisma unique constraint
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    // Foreign key constraint (e.g., invalid categoryId)
    if (err?.code === "P2003") {
      const field = err?.meta?.field_name || err?.meta?.target || "reference";
      const message = `Invalid reference (${String(field)}). Check categoryId or createdById.`;
      const body: any = { error: message };
      if (process.env.NODE_ENV !== "production" && err?.meta) body.meta = err.meta;
      return NextResponse.json(body, { status: 400 });
    }
    // zod validation
    if (err?.issues) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    console.error("[admin.products.create]", err);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: "Internal Server Error", message: String(err?.message || err) }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
