import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categories (admin-managed)
  const categories = await prisma.$transaction([
    prisma.templateCategory.upsert({
      where: { slug: "header_google_form" },
      update: {},
      create: { slug: "header_google_form", name: "Header Google Form", position: 1, isActive: true },
    }),
    prisma.templateCategory.upsert({
      where: { slug: "lanyard" },
      update: {},
      create: { slug: "lanyard", name: "Lanyard", position: 2, isActive: true },
    }),
    prisma.templateCategory.upsert({
      where: { slug: "id_card" },
      update: {},
      create: { slug: "id_card", name: "ID Card", position: 3, isActive: true },
    }),
    prisma.templateCategory.upsert({
      where: { slug: "organigram" },
      update: {},
      create: { slug: "organigram", name: "Organigram", position: 4, isActive: true },
    }),
  ]);

  const catIndex = Object.fromEntries(categories.map((c) => [c.slug, c.id] as const));

  // Products examples
  await prisma.templateProduct.upsert({
    where: { slug: "grid-with-gap" },
    update: {},
    create: {
      slug: "grid-with-gap",
      title: "Grid With Gap 3xN",
      description: "Template grid 3 kolom dengan jarak antar slice (width komposit 3130px).",
      price: 39000,
      imageUrl: "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=1200&auto=format&fit=crop",
      categoryId: catIndex["header_google_form"],
      soldCount: 152,
      links: {
        create: [
          { url: "https://s.id/ruOjY", label: "3x1", position: 1, mode: "with_gap" },
          { url: "https://s.id/LLhHl", label: "3x2", position: 2, mode: "with_gap" },
        ],
      },
    },
  });

  await prisma.templateProduct.upsert({
    where: { slug: "grid-without-gap" },
    update: {},
    create: {
      slug: "grid-without-gap",
      title: "Grid Without Gap 3xN",
      description: "Template grid rapat tanpa jarak (width komposit 3110px).",
      price: 49000,
      imageUrl: "https://images.unsplash.com/photo-1520974735194-5f36c7aef2cb?q=80&w=1200&auto=format&fit=crop",
      categoryId: catIndex["id_card"],
      soldCount: 233,
      links: {
        create: [
          { url: "https://s.id/without-gap-3x1", label: "3x1", position: 1, mode: "without_gap" },
          { url: "https://s.id/without-gap-3x2", label: "3x2", position: 2, mode: "without_gap" },
        ],
      },
    },
  });

  await prisma.templateProduct.upsert({
    where: { slug: "carousel-basic" },
    update: {},
    create: {
      slug: "carousel-basic",
      title: "Carousel Basic",
      description: "Carousel multi-slide untuk storytelling.",
      price: 45000,
      imageUrl: "https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=1200&auto=format&fit=crop",
      categoryId: catIndex["organigram"],
      soldCount: 87,
      links: { create: [{ url: "https://s.id/DeH5H", label: "Preview", position: 1, mode: "carousel" }] },
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
