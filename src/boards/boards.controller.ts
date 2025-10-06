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
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class CreateBoardDto {
  @IsString()
  name: string;

  @IsString()
  projectId: string;
}

class UpdateBoardDto {
  @IsString()
  name?: string;
}

@ApiTags('boards')
@Controller('boards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create board' })
  @ApiBody({ type: CreateBoardDto })
  @ApiResponse({ status: 201, description: 'Board created' })
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, description: 'List of boards' })
  findAll(@Query('projectId') projectId?: string) {
    return this.boardsService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board by ID' })
  @ApiResponse({ status: 200, description: 'Board details' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update board' })
  @ApiBody({ type: UpdateBoardDto })
  @ApiResponse({ status: 200, description: 'Board updated' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete board' })
  @ApiResponse({ status: 200, description: 'Board deleted' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  remove(@Param('id') id: string) {
    return this.boardsService.remove(id);
  }
}