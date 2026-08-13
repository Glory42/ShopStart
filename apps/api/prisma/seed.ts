import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy apps/api/.env.example to apps/api/.env first.",
  );
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Apparel", slug: "apparel" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Electronics", slug: "electronics" },
  { name: "Outdoors", slug: "outdoors" },
] as const;

/**
 * Deterministic placeholder tied to the product's own name, styled to match
 * the storefront's dark palette (design.md: paper-2 / graphite). Earlier
 * seed data pulled random unrelated stock photos from picsum.photos (a
 * bluebonnet field for a t-shirt, an ocean for a jacket) — accurate-looking
 * but content-mismatched. Keyword-based photo services (Unsplash Source,
 * loremflickr) were evaluated and rejected: Unsplash Source is shut down
 * (503) and loremflickr 500s on the majority of category-relevant keywords,
 * unacceptable for a template other developers clone and run `bun run seed`
 * against. A labeled placeholder is honest about being a placeholder and
 * never breaks.
 */
function placeholderImage(name: string): string {
  return `https://placehold.co/600x600/1c1c1e/98989d?text=${encodeURIComponent(name)}`;
}

const PRODUCTS: {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categorySlug: (typeof CATEGORIES)[number]["slug"];
}[] = [
  {
    name: "Everyday Crew Tee",
    description: "A soft, durable cotton t-shirt for daily wear.",
    price: 24.0,
    stockQuantity: 120,
    categorySlug: "apparel",
  },
  {
    name: "Classic Denim Jacket",
    description: "Mid-weight denim jacket with a relaxed fit.",
    price: 89.0,
    stockQuantity: 45,
    categorySlug: "apparel",
  },
  {
    name: "Merino Wool Beanie",
    description: "Warm, itch-free beanie knit from merino wool.",
    price: 32.0,
    stockQuantity: 80,
    categorySlug: "apparel",
  },
  {
    name: "Relaxed Fit Chino",
    description: "Straight-leg chino in brushed cotton twill.",
    price: 68.0,
    stockQuantity: 65,
    categorySlug: "apparel",
  },
  {
    name: "Waffle-Knit Henley",
    description: "Long-sleeve henley in a textured waffle knit.",
    price: 42.0,
    stockQuantity: 90,
    categorySlug: "apparel",
  },
  {
    name: "Wool-Blend Overshirt",
    description: "Heavyweight shirt-jacket for layering in cold weather.",
    price: 96.0,
    stockQuantity: 25,
    categorySlug: "apparel",
  },
  {
    name: "Ribbed Crew Socks, 3-Pack",
    description: "Combed cotton crew socks with reinforced heel and toe.",
    price: 18.0,
    stockQuantity: 200,
    categorySlug: "apparel",
  },
  {
    name: "Ceramic Pour-Over Set",
    description: "Hand-glazed ceramic dripper with matching carafe.",
    price: 58.0,
    stockQuantity: 30,
    categorySlug: "home-kitchen",
  },
  {
    name: "Cast Iron Skillet, 10-inch",
    description: "Pre-seasoned cast iron skillet for stovetop or oven.",
    price: 42.0,
    stockQuantity: 60,
    categorySlug: "home-kitchen",
  },
  {
    name: "Linen Throw Pillow",
    description: "100% linen cover with a feather-down insert.",
    price: 36.0,
    stockQuantity: 75,
    categorySlug: "home-kitchen",
  },
  {
    name: "Stoneware Dinner Plate Set",
    description: "Set of 4 hand-glazed stoneware dinner plates.",
    price: 72.0,
    stockQuantity: 40,
    categorySlug: "home-kitchen",
  },
  {
    name: "Enamel Dutch Oven, 5-Quart",
    description: "Cast iron Dutch oven with a chip-resistant enamel coating.",
    price: 145.0,
    stockQuantity: 0,
    categorySlug: "home-kitchen",
  },
  {
    name: "Walnut Cutting Board",
    description: "End-grain walnut board with a routed juice groove.",
    price: 54.0,
    stockQuantity: 35,
    categorySlug: "home-kitchen",
  },
  {
    name: "Cotton Waffle Bath Towel Set",
    description: "Set of 2 quick-dry waffle-weave bath towels.",
    price: 44.0,
    stockQuantity: 85,
    categorySlug: "home-kitchen",
  },
  {
    name: "Wireless Earbuds",
    description: "Noise-isolating earbuds with 24-hour battery case.",
    price: 79.0,
    stockQuantity: 100,
    categorySlug: "electronics",
  },
  {
    name: "USB-C Fast Charger, 65W",
    description: "Compact GaN charger for laptops and phones.",
    price: 39.0,
    stockQuantity: 150,
    categorySlug: "electronics",
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Water-resistant speaker with 12-hour playtime.",
    price: 65.0,
    stockQuantity: 55,
    categorySlug: "electronics",
  },
  {
    name: "Wireless Charging Pad",
    description: "10W Qi charging pad with a non-slip silicone surface.",
    price: 29.0,
    stockQuantity: 110,
    categorySlug: "electronics",
  },
  {
    name: "Compact Mechanical Keyboard",
    description: "75% layout mechanical keyboard with hot-swappable switches.",
    price: 119.0,
    stockQuantity: 30,
    categorySlug: "electronics",
  },
  {
    name: "USB-C Hub, 7-in-1",
    description: "HDMI, USB-A, SD, and 100W passthrough in one hub.",
    price: 49.0,
    stockQuantity: 70,
    categorySlug: "electronics",
  },
  {
    name: "Noise-Cancelling Headphones",
    description: "Over-ear headphones with active noise cancellation.",
    price: 189.0,
    stockQuantity: 20,
    categorySlug: "electronics",
  },
  {
    name: "35L Daypack",
    description: "Weatherproof daypack with a padded laptop sleeve.",
    price: 94.0,
    stockQuantity: 40,
    categorySlug: "outdoors",
  },
  {
    name: "Insulated Steel Bottle, 32oz",
    description: "Keeps drinks cold for 24 hours, hot for 12.",
    price: 34.0,
    stockQuantity: 90,
    categorySlug: "outdoors",
  },
  {
    name: "Compact Camp Chair",
    description: "Folds down to the size of a water bottle.",
    price: 48.0,
    stockQuantity: 0,
    categorySlug: "outdoors",
  },
  {
    name: "Packable Rain Shell",
    description: "Waterproof shell jacket that packs into its own pocket.",
    price: 78.0,
    stockQuantity: 50,
    categorySlug: "outdoors",
  },
  {
    name: "Enamel Camp Mug",
    description: "16oz enamel mug with a rolled rim and wire handle.",
    price: 16.0,
    stockQuantity: 130,
    categorySlug: "outdoors",
  },
  {
    name: "Rechargeable LED Lantern",
    description: "300-lumen lantern with a USB-C rechargeable battery.",
    price: 38.0,
    stockQuantity: 60,
    categorySlug: "outdoors",
  },
  {
    name: "Trail Running Socks, 2-Pack",
    description: "Cushioned, moisture-wicking socks for long runs.",
    price: 22.0,
    stockQuantity: 95,
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
    const imageUrl = placeholderImage(product.name);
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { description: product.description, price: product.price, imageUrl, categoryId },
      });
      continue;
    }
    await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl,
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
