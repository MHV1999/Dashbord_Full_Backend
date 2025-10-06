import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class CreateCommentDto {
  @IsString()
  content: string;
}

@ApiTags('comments')
@Controller('issues/:issueId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comment created' })
  create(@Param('issueId') issueId: string, @Body() createCommentDto: CreateCommentDto, @Req() req: any) {
    const userId = req.user.id;
    return this.commentsService.create(issueId, userId, createCommentDto.content);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for issue' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  findAll(@Param('issueId') issueId: string) {
    return this.commentsService.findAll(issueId);
  }
}