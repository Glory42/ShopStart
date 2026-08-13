import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, resetDatabase } from "./test-app";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";

/**
 * The reason this e2e suite exists at all: CONTEXT.md guarantees stock is
 * "decremented transactionally at Checkout to prevent overselling under
 * concurrent purchases." OrdersService's unit tests (orders.service.spec.ts)
 * only prove the guarded `updateMany` WHERE clause is *constructed*
 * correctly against a mocked PrismaService — they cannot prove Postgres
 * actually serializes two simultaneous transactions racing for the same
 * row. Only a real database, hit concurrently, can prove that.
 */
describe("Checkout concurrency (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerBuyer(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/auth/register").send({ email, username: email.split("@")[0], password: "hunter22" });

    const addressRes = await agent.post("/addresses").send({
      line1: "1 Main St",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "US",
    });

    return { agent, addressId: addressRes.body.id as string };
  }

  it("lets exactly one of two simultaneous checkouts win the last unit of stock", async () => {
    const category = await prisma.category.create({ data: { name: "Apparel", slug: "apparel" } });
    const product = await prisma.product.create({
      data: {
        name: "Last Unit Tee",
        description: "Only one left.",
        price: 24,
        stockQuantity: 1,
        imageUrl: "https://placehold.co/600x600",
        categoryId: category.id,
      },
    });

    const buyerA = await registerBuyer("buyer-a@shopstart.dev");
    const buyerB = await registerBuyer("buyer-b@shopstart.dev");

    await buyerA.agent.post("/cart/items").send({ productId: product.id, quantity: 1 });
    await buyerB.agent.post("/cart/items").send({ productId: product.id, quantity: 1 });

    const [resA, resB] = await Promise.all([
      buyerA.agent.post("/orders/checkout").send({ shippingAddressId: buyerA.addressId }),
      buyerB.agent.post("/orders/checkout").send({ shippingAddressId: buyerB.addressId }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 400]);

    const finalProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(finalProduct.stockQuantity).toBe(0);

    const allOrders = await prisma.order.findMany();
    expect(allOrders).toHaveLength(1);
  });

  it("lets both checkouts succeed when stock covers both", async () => {
    const category = await prisma.category.create({ data: { name: "Apparel", slug: "apparel-2" } });
    const product = await prisma.product.create({
      data: {
        name: "Plenty In Stock Tee",
        description: "Two left.",
        price: 24,
        stockQuantity: 2,
        imageUrl: "https://placehold.co/600x600",
        categoryId: category.id,
      },
    });

    const buyerA = await registerBuyer("buyer-c@shopstart.dev");
    const buyerB = await registerBuyer("buyer-d@shopstart.dev");

    await buyerA.agent.post("/cart/items").send({ productId: product.id, quantity: 1 });
    await buyerB.agent.post("/cart/items").send({ productId: product.id, quantity: 1 });

    const [resA, resB] = await Promise.all([
      buyerA.agent.post("/orders/checkout").send({ shippingAddressId: buyerA.addressId }),
      buyerB.agent.post("/orders/checkout").send({ shippingAddressId: buyerB.addressId }),
    ]);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);

    const finalProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(finalProduct.stockQuantity).toBe(0);
  });
});
