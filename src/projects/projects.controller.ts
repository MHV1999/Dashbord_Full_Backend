import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  organizationId: string;
}

class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class AddMemberDto {
  @IsString()
  userId: string;

  @IsString()
  roleId: string;
}

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: 'Project created' })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: Request) {
    const userId = req['user'].id;
    return this.projectsService.create({
      ...createProjectDto,
      ownerId: userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiResponse({ status: 200, description: 'List of projects' })
  findAll(@Query('orgId') orgId?: string) {
    return this.projectsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project' })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({ status: 200, description: 'Member added' })
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return this.projectsService.addMember(id, addMemberDto.userId, addMemberDto.roleId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from project' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }
}