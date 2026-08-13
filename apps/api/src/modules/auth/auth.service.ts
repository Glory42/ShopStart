import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type { LoginInput, RegisterInput } from "@shopstart/types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload,
} from "./auth.types";

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthenticatedUser> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) {
      throw new ConflictException("Email or username already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        phone: input.phone,
        passwordHash,
        cart: { create: {} },
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async validateCredentials(input: LoginInput): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException("Invalid credentials");

    return { id: user.id, email: user.email, role: user.role };
  }

  async issueTokens(user: AuthenticatedUser) {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const refreshPayload: RefreshTokenPayload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN"),
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return this.issueTokens(authenticatedUser);
  }
}
