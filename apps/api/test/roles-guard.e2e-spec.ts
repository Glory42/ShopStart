import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@shopstart/types";
import { createTestApp, resetDatabase } from "./test-app";
import { PrismaService } from "../src/infrastructure/prisma/prisma.service";

/**
 * auth.e2e-spec.ts proves JwtAuthGuard for real (no cookie -> genuine 401).
 * RolesGuard has no equivalent proof: every unit test for the services
 * behind admin-only routes calls the service directly, so the guard itself
 * is never exercised. This suite hits the real HTTP routes as a logged-in
 * regular USER and asserts a genuine 403, then as a real ADMIN and asserts
 * the route actually works.
 */
describe("RolesGuard (e2e)", () => {
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

  const password = "hunter22";

  async function registerUser(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/auth/register").send({ email, username: email.split("@")[0], password });
    return agent;
  }

  /**
   * There's no self-serve promotion route, so an ADMIN is seeded directly
   * via Prisma. The user then logs in through the real /auth/login route so
   * the access token's baked-in `role` claim (see AuthService.issueTokens)
   * genuinely reflects ADMIN, the same way it would for a real admin account.
   */
  async function loginAsAdmin(email: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, username: email.split("@")[0], passwordHash, role: Role.ADMIN },
    });

    const agent = request.agent(app.getHttpServer());
    await agent.post("/auth/login").send({ email, password });
    return agent;
  }

  const missingOrderId = "00000000-0000-0000-0000-000000000000";
  const missingUserId = "00000000-0000-0000-0000-000000000000";

  describe("as a regular USER", () => {
    it("rejects GET /orders/admin with a real 403", async () => {
      const agent = await registerUser("user-orders-admin@shopstart.dev");
      const res = await agent.get("/orders/admin");
      expect(res.status).toBe(403);
    });

    it("rejects PATCH /orders/:id/status with a real 403", async () => {
      const agent = await registerUser("user-orders-status@shopstart.dev");
      const res = await agent
        .patch(`/orders/${missingOrderId}/status`)
        .send({ status: "PAID" });
      expect(res.status).toBe(403);
    });

    it("rejects GET /users with a real 403", async () => {
      const agent = await registerUser("user-users-list@shopstart.dev");
      const res = await agent.get("/users");
      expect(res.status).toBe(403);
    });

    it("rejects GET /users/:id with a real 403", async () => {
      const agent = await registerUser("user-users-one@shopstart.dev");
      const res = await agent.get(`/users/${missingUserId}`);
      expect(res.status).toBe(403);
    });
  });

  describe("as an ADMIN", () => {
    it("allows GET /orders/admin and returns the order list", async () => {
      const agent = await loginAsAdmin("admin-orders-admin@shopstart.dev");
      const res = await agent.get("/orders/admin");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("allows PATCH /orders/:id/status and actually transitions a real order", async () => {
      const category = await prisma.category.create({
        data: { name: "Apparel", slug: "roles-guard-apparel" },
      });
      const product = await prisma.product.create({
        data: {
          name: "Roles Guard Tee",
          description: "For the roles guard e2e suite.",
          price: 24,
          stockQuantity: 5,
          imageUrl: "https://placehold.co/600x600",
          categoryId: category.id,
        },
      });

      const buyer = await registerUser("buyer-for-status@shopstart.dev");
      const addressRes = await buyer.post("/addresses").send({
        line1: "1 Main St",
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "US",
      });
      await buyer.post("/cart/items").send({ productId: product.id, quantity: 1 });
      const checkoutRes = await buyer
        .post("/orders/checkout")
        .send({ shippingAddressId: addressRes.body.id });
      const orderId = checkoutRes.body.id as string;

      const admin = await loginAsAdmin("admin-orders-status@shopstart.dev");
      const res = await admin.patch(`/orders/${orderId}/status`).send({ status: "PAID" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PAID");
    });

    it("allows GET /users and returns the user list", async () => {
      const agent = await loginAsAdmin("admin-users-list@shopstart.dev");
      const res = await agent.get("/users");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((u: { email: string }) => u.email === "admin-users-list@shopstart.dev")).toBe(
        true,
      );
    });

    it("allows GET /users/:id and returns the target user", async () => {
      const admin = await loginAsAdmin("admin-users-one@shopstart.dev");
      const target = await registerUser("target-for-lookup@shopstart.dev");
      const meRes = await target.get("/users/me");

      const res = await admin.get(`/users/${meRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("target-for-lookup@shopstart.dev");
    });
  });
});
