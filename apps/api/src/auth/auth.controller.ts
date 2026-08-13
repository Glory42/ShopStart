import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { loginSchema, registerSchema } from "@shopstart/types";
import type { LoginInput, RegisterInput } from "@shopstart/types";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import type { AuthenticatedUser } from "./auth.types";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/auth",
  });
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.register(input);
    const tokens = await this.auth.issueTokens(user);
    setAuthCookies(res, tokens);
    return user;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateCredentials(input);
    const tokens = await this.auth.issueTokens(user);
    setAuthCookies(res, tokens);
    return user;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.refreshAccessToken(user.id);
    setAuthCookies(res, tokens);
    return { success: true };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
