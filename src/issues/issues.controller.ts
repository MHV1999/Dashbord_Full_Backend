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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { IsString, IsOptional } from 'class-validator';

class CreateIssueDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  listId: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}

class UpdateIssueDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  listId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}

@ApiTags('issues')
@Controller('projects/:projectId/issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create issue' })
  @ApiBody({ type: CreateIssueDto })
  @ApiResponse({ status: 201, description: 'Issue created' })
  async create(@Param('projectId') projectId: string, @Body() createIssueDto: CreateIssueDto) {
    const issue = await this.issuesService.create(projectId, createIssueDto);
    this.realtimeGateway.emitToProject(projectId, 'issue:created', {
      id: issue.id,
      title: issue.title,
      status: issue.listId,
      assigneeId: issue.assigneeId,
    });
    return issue;
  }

  @Get()
  @ApiOperation({ summary: 'Get all issues in project' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiResponse({ status: 200, description: 'List of issues' })
  findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const filters = { status, assigneeId };
    const pagination = {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    };
    return this.issuesService.findAll(projectId, filters, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiResponse({ status: 200, description: 'Issue details' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update issue' })
  @ApiBody({ type: UpdateIssueDto })
  @ApiResponse({ status: 200, description: 'Issue updated' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async update(@Param('id') id: string, @Param('projectId') projectId: string, @Body() updateIssueDto: UpdateIssueDto) {
    const issue = await this.issuesService.update(id, updateIssueDto);
    this.realtimeGateway.emitToProject(projectId, 'issue:updated', {
      id: issue.id,
      title: issue.title,
      status: issue.listId,
      assigneeId: issue.assigneeId,
    });
    return issue;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete issue' })
  @ApiResponse({ status: 200, description: 'Issue deleted' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async remove(@Param('id') id: string, @Param('projectId') projectId: string) {
    const issue = await this.issuesService.findOne(id); // Get before delete
    await this.issuesService.remove(id);
    this.realtimeGateway.emitToProject(projectId, 'issue:deleted', {
      id: issue.id,
      title: issue.title,
      status: issue.listId,
      assigneeId: issue.assigneeId,
    });
  }
}