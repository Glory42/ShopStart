import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, resetDatabase } from "./test-app";

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const credentials = { email: "customer@shopstart.dev", username: "customer", password: "hunter22" };

  describe("POST /auth/register", () => {
    it("creates an account and sets httpOnly auth cookies", async () => {
      const res = await request(app.getHttpServer()).post("/auth/register").send(credentials);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: expect.any(String), email: credentials.email, role: "USER" });
      expect(res.body.passwordHash).toBeUndefined();

      const cookies = res.headers["set-cookie"] as unknown as string[];
      expect(cookies.some((c) => c.startsWith("access_token=") && c.includes("HttpOnly"))).toBe(
        true,
      );
      expect(cookies.some((c) => c.startsWith("refresh_token=") && c.includes("HttpOnly"))).toBe(
        true,
      );
    });

    it("rejects a body that fails Zod validation with a real 400 over HTTP", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "not-an-email", username: "x", password: "short" });

      expect(res.status).toBe(400);
    });

    it("rejects registering the same email twice", async () => {
      await request(app.getHttpServer()).post("/auth/register").send(credentials);

      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ ...credentials, username: "someone-else" });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /auth/me", () => {
    it("rejects a request with no auth cookie (guard enforced for real)", async () => {
      const res = await request(app.getHttpServer()).get("/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns the current user when the access cookie is valid", async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post("/auth/register").send(credentials);

      const res = await agent.get("/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(credentials.email);
    });
  });

  describe("POST /auth/login", () => {
    it("rejects an unknown email", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "nobody@shopstart.dev", password: "whatever1" });

      expect(res.status).toBe(401);
    });

    it("rejects a wrong password", async () => {
      await request(app.getHttpServer()).post("/auth/register").send(credentials);

      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: credentials.email, password: "wrong-password" });

      expect(res.status).toBe(401);
    });

    it("logs in with correct credentials and sets fresh auth cookies", async () => {
      await request(app.getHttpServer()).post("/auth/register").send(credentials);

      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: credentials.email, password: credentials.password });

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("POST /auth/logout", () => {
    it("clears auth cookies so a subsequent /auth/me is rejected", async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post("/auth/register").send(credentials);
      await agent.post("/auth/logout");

      const res = await agent.get("/auth/me");

      expect(res.status).toBe(401);
    });
  });
});
