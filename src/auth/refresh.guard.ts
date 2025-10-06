import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";

/**
 * Guard to protect /auth/refresh endpoint.
 * Reads raw refresh token from cookie "refresh_token" or header "x-refresh-token",
 * validates via AuthService.validateRefreshToken(), and attaches token record.
 */
@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const cookieToken =
      (req.cookies && (req.cookies["refresh_token"] as string)) || null;
    const headerToken = req.get("x-refresh-token") || null;
    const rawToken = cookieToken || headerToken;
    if (!rawToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const tokenRecord = await this.authService.validateRefreshToken(rawToken);
    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Attach to request for controller use
    (req as any).refreshTokenRecord = tokenRecord;
    (req as any).rawRefreshToken = rawToken;
    return true;
  }
}
