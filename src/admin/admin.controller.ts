import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { IsString, IsOptional } from 'class-validator';

class ImpersonateDto {
  @IsString()
  userId: string;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('admin') // Assuming permissions decorator checks for admin
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of users' })
  getUsers(
    @Query('email') email?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers({ email, status });
  }

  @Post('impersonate')
  @ApiOperation({ summary: 'Impersonate a user' })
  @ApiBody({ type: ImpersonateDto })
  @ApiResponse({ status: 201, description: 'Impersonation token issued' })
  async impersonate(@Body() impersonateDto: ImpersonateDto, @Req() req: any) {
    const adminId = req.user.id;
    return this.adminService.impersonate(impersonateDto.userId, adminId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.adminService.getAuditLogs(filters);
  }
}