import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RefreshGuard } from "./refresh.guard";

class LoginDto {
  email: string;
  password: string;
}

class LoginResponse {
  accessToken: string;
  expiresIn: number;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login: validate credentials, issue access & refresh tokens.
   * Refresh token is set as HttpOnly cookie.
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const deviceInfo = req.get("user-agent") || "unknown";
    const result = await this.authService.signInByEmail(
      loginDto.email,
      loginDto.password,
      deviceInfo
    );
    // result: { accessToken, expiresIn, accessJti, refreshToken, refreshJti, refreshExpiresAt, user }

    const ttlSeconds =
      Number(process.env.REFRESH_TOKEN_TTL) || 14 * 24 * 60 * 60;
    const secureCookie = process.env.NODE_ENV === "production";

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: ttlSeconds * 1000,
      path: "/",
    });

    return res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  }

  /**
   * Refresh: Guard validates the refresh token (from cookie or header),
   * attaches token record to request. We rotate the refresh token and issue new access.
   */
  @Post("refresh")
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({
    status: 200,
    description: "Token refreshed",
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async refresh(@Req() req: Request, @Res() res: Response) {
    // Guard set these:
    const tokenRecord = (req as any).refreshTokenRecord;
    const user = tokenRecord.user;
    const oldJti = tokenRecord.jti;

    // rotate: mark old as revoked and create a new refresh token
    const { token: newRefreshToken } =
      await this.authService.rotateRefreshToken(
        oldJti,
        user.id,
        req.get("user-agent") || "unknown"
      );

    // create new access token
    const { accessToken, expiresIn } =
      await this.authService.createAccessToken(user);

    const ttlSeconds =
      Number(process.env.REFRESH_TOKEN_TTL) || 14 * 24 * 60 * 60;
    const secureCookie = process.env.NODE_ENV === "production";

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: ttlSeconds * 1000,
      path: "/",
    });

    return res.json({
      accessToken,
      expiresIn,
    });
  }

  /**
   * Logout: revoke current refresh token (if any) and clear cookie.
   */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user" })
  @ApiCookieAuth("refresh_token")
  @ApiResponse({ status: 200, description: "Logged out" })
  async logout(@Req() req: Request, @Res() res: Response) {
    const raw = req.cookies && req.cookies["refresh_token"];
    if (raw) {
      const tokenRecord = await this.authService.validateRefreshToken(raw);
      if (tokenRecord) {
        await this.authService.revokeRefreshTokenByJti(tokenRecord.jti);
      }
    }

    res.clearCookie("refresh_token", { path: "/" });
    return res.json({ message: "Logged out" });
  }

  /**
   * Get current user info (protected by access token)
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user info" })
  @ApiResponse({ status: 200, description: "User info" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async me(@Req() req: Request) {
    const user = req["user"];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
