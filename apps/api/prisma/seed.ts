import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Apparel", slug: "apparel" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Electronics", slug: "electronics" },
  { name: "Outdoors", slug: "outdoors" },
] as const;

const PRODUCTS: {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  categorySlug: (typeof CATEGORIES)[number]["slug"];
}[] = [
  {
    name: "Everyday Crew Tee",
    description: "A soft, durable cotton t-shirt for daily wear.",
    price: 24.0,
    stockQuantity: 120,
    imageUrl: "https://picsum.photos/seed/shopstart-tee/600/600",
    categorySlug: "apparel",
  },
  {
    name: "Classic Denim Jacket",
    description: "Mid-weight denim jacket with a relaxed fit.",
    price: 89.0,
    stockQuantity: 45,
    imageUrl: "https://picsum.photos/seed/shopstart-jacket/600/600",
    categorySlug: "apparel",
  },
  {
    name: "Merino Wool Beanie",
    description: "Warm, itch-free beanie knit from merino wool.",
    price: 32.0,
    stockQuantity: 80,
    imageUrl: "https://picsum.photos/seed/shopstart-beanie/600/600",
    categorySlug: "apparel",
  },
  {
    name: "Ceramic Pour-Over Set",
    description: "Hand-glazed ceramic dripper with matching carafe.",
    price: 58.0,
    stockQuantity: 30,
    imageUrl: "https://picsum.photos/seed/shopstart-pourover/600/600",
    categorySlug: "home-kitchen",
  },
  {
    name: "Cast Iron Skillet, 10-inch",
    description: "Pre-seasoned cast iron skillet for stovetop or oven.",
    price: 42.0,
    stockQuantity: 60,
    imageUrl: "https://picsum.photos/seed/shopstart-skillet/600/600",
    categorySlug: "home-kitchen",
  },
  {
    name: "Linen Throw Pillow",
    description: "100% linen cover with a feather-down insert.",
    price: 36.0,
    stockQuantity: 75,
    imageUrl: "https://picsum.photos/seed/shopstart-pillow/600/600",
    categorySlug: "home-kitchen",
  },
  {
    name: "Wireless Earbuds",
    description: "Noise-isolating earbuds with 24-hour battery case.",
    price: 79.0,
    stockQuantity: 100,
    imageUrl: "https://picsum.photos/seed/shopstart-earbuds/600/600",
    categorySlug: "electronics",
  },
  {
    name: "USB-C Fast Charger, 65W",
    description: "Compact GaN charger for laptops and phones.",
    price: 39.0,
    stockQuantity: 150,
    imageUrl: "https://picsum.photos/seed/shopstart-charger/600/600",
    categorySlug: "electronics",
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Water-resistant speaker with 12-hour playtime.",
    price: 65.0,
    stockQuantity: 55,
    imageUrl: "https://picsum.photos/seed/shopstart-speaker/600/600",
    categorySlug: "electronics",
  },
  {
    name: "35L Daypack",
    description: "Weatherproof daypack with a padded laptop sleeve.",
    price: 94.0,
    stockQuantity: 40,
    imageUrl: "https://picsum.photos/seed/shopstart-daypack/600/600",
    categorySlug: "outdoors",
  },
  {
    name: "Insulated Steel Bottle, 32oz",
    description: "Keeps drinks cold for 24 hours, hot for 12.",
    price: 34.0,
    stockQuantity: 90,
    imageUrl: "https://picsum.photos/seed/shopstart-bottle/600/600",
    categorySlug: "outdoors",
  },
  {
    name: "Compact Camp Chair",
    description: "Folds down to the size of a water bottle.",
    price: 48.0,
    stockQuantity: 0,
    imageUrl: "https://picsum.photos/seed/shopstart-chair/600/600",
    categorySlug: "outdoors",
  },
];

async function main() {
  console.log("Seeding categories...");
  const categoryBySlug = new Map<string, string>();
  for (const category of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name },
    });
    categoryBySlug.set(category.slug, created.id);
  }

  console.log("Seeding products...");
  for (const product of PRODUCTS) {
    const categoryId = categoryBySlug.get(product.categorySlug)!;
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        categoryId,
      },
    });
  }

  console.log("Seeding demo users...");
  const adminPasswordHash = await bcrypt.hash("shopstart-admin", 10);
  await prisma.user.upsert({
    where: { email: "admin@shopstart.dev" },
    create: {
      email: "admin@shopstart.dev",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      cart: { create: {} },
    },
    update: {},
  });

  const customerPasswordHash = await bcrypt.hash("shopstart-customer", 10);
  await prisma.user.upsert({
    where: { email: "customer@shopstart.dev" },
    create: {
      email: "customer@shopstart.dev",
      username: "customer",
      passwordHash: customerPasswordHash,
      role: "USER",
      cart: { create: {} },
    },
    update: {},
  });

  console.log("Done. Demo logins:");
  console.log("  admin@shopstart.dev / shopstart-admin");
  console.log("  customer@shopstart.dev / shopstart-customer");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
