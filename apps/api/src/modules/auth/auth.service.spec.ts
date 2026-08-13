import { Test } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuthService } from "./auth.service";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let prisma: { user: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };

  const storedUser = {
    id: "user-1",
    email: "customer@shopstart.dev",
    username: "customer",
    role: "USER",
    passwordHash: "hashed-password",
  };

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue("signed-token") };
    config = { get: jest.fn((key: string) => `config:${key}`) };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("rejects a duplicate email or username", async () => {
      prisma.user.findFirst.mockResolvedValue(storedUser);

      await expect(
        service.register({
          email: storedUser.email,
          username: "someone-new",
          password: "hunter2",
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("hashes the password before storing it, never stores it plain", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      prisma.user.create.mockResolvedValue(storedUser);

      await service.register({
        email: storedUser.email,
        username: storedUser.username,
        password: "hunter2",
      } as never);

      expect(bcrypt.hash).toHaveBeenCalledWith("hunter2", 10);
      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.passwordHash).toBe("hashed-password");
      expect(createArgs.data.password).toBeUndefined();
    });

    it("returns only id/email/role — never the password hash", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      prisma.user.create.mockResolvedValue(storedUser);

      const result = await service.register({
        email: storedUser.email,
        username: storedUser.username,
        password: "hunter2",
      } as never);

      expect(result).toEqual({ id: storedUser.id, email: storedUser.email, role: storedUser.role });
    });
  });

  describe("validateCredentials", () => {
    it("rejects an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateCredentials({ email: "nobody@shopstart.dev", password: "x" } as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a wrong password without revealing which check failed", async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateCredentials({ email: storedUser.email, password: "wrong" } as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("returns the authenticated user on a correct password", async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateCredentials({
        email: storedUser.email,
        password: "hunter2",
      } as never);

      expect(result).toEqual({ id: storedUser.id, email: storedUser.email, role: storedUser.role });
    });
  });

  describe("issueTokens", () => {
    it("signs the access and refresh tokens with different secrets", async () => {
      const user = { id: "user-1", email: storedUser.email, role: "USER" as const };

      await service.issueTokens(user);

      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: "user-1", email: storedUser.email, role: "USER" },
        expect.objectContaining({ secret: "config:JWT_ACCESS_SECRET" }),
      );
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: "user-1" },
        expect.objectContaining({ secret: "config:JWT_REFRESH_SECRET" }),
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("rejects a refresh for a user that no longer exists", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken("missing-user")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("re-issues tokens for an existing user", async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);

      const result = await service.refreshAccessToken("user-1");

      expect(result).toEqual({ accessToken: "signed-token", refreshToken: "signed-token" });
    });
  });
});
