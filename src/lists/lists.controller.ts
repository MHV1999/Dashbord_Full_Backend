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
import { ListsService } from './lists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional, IsInt } from 'class-validator';

class CreateListDto {
  @IsString()
  name: string;

  @IsString()
  boardId: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

class UpdateListDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

@ApiTags('lists')
@Controller('lists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create list' })
  @ApiBody({ type: CreateListDto })
  @ApiResponse({ status: 201, description: 'List created' })
  create(@Body() createListDto: CreateListDto) {
    return this.listsService.create(createListDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lists' })
  @ApiQuery({ name: 'boardId', required: false })
  @ApiResponse({ status: 200, description: 'List of lists' })
  findAll(@Query('boardId') boardId?: string) {
    return this.listsService.findAll(boardId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get list by ID' })
  @ApiResponse({ status: 200, description: 'List details' })
  @ApiResponse({ status: 404, description: 'List not found' })
  findOne(@Param('id') id: string) {
    return this.listsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update list' })
  @ApiBody({ type: UpdateListDto })
  @ApiResponse({ status: 200, description: 'List updated' })
  @ApiResponse({ status: 404, description: 'List not found' })
  update(@Param('id') id: string, @Body() updateListDto: UpdateListDto) {
    if (updateListDto.position !== undefined) {
      return this.listsService.updatePosition(id, updateListDto.position);
    }
    return this.listsService.update(id, { name: updateListDto.name });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete list' })
  @ApiResponse({ status: 200, description: 'List deleted' })
  @ApiResponse({ status: 404, description: 'List not found' })
  remove(@Param('id') id: string) {
    return this.listsService.remove(id);
  }
}