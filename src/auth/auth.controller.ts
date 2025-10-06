import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenGuard } from './refresh.guard';

class LoginDto {
  email: string;
  password: string;
}

class LoginResponse {
  accessToken: string;
  expiresIn: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = await this.authService.createAccessToken(user);
    const { token: refreshToken } =
      await this.authService.createRefreshToken(user);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      accessToken,
      expiresIn: 15 * 60, // 15 minutes
    });
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed',
    type: LoginResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(@Res() res: Response) {
    // The guard attaches the refresh token record to req.refreshToken
    // For simplicity, assuming req.user is set by guard
    const user = res.req['user'];
    const oldJti = res.req['refreshToken'].id; // Assuming jti is id

    const { token: newRefreshToken } =
      await this.authService.rotateRefreshToken(oldJti, user.id);
    const accessToken = await this.authService.createAccessToken(user);

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      expiresIn: 15 * 60,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Res() res: Response) {
    const refreshToken = res.req.cookies['refresh_token'];
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Res() res: Response) {
    const user = res.req['user'];
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }
}