import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
import type { Request } from "express";
import type { RefreshTokenPayload } from "../auth.types";

function extractFromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_REFRESH_SECRET"),
    });
  }

  validate(payload: RefreshTokenPayload): { id: string } {
    return { id: payload.sub };
  }
}
