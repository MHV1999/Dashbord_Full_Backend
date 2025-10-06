import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsPositive } from 'class-validator';

class PresignDto {
  @IsString()
  issueId: string;

  @IsString()
  filename: string;

  @IsString()
  contentType: string;

  @IsNumber()
  @IsPositive()
  size: number;
}

class ConfirmDto {
  @IsString()
  objectKey: string;

  @IsString()
  issueId: string;
}

@ApiTags('attachments')
@Controller('attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get presigned URL for upload' })
  @ApiBody({ type: PresignDto })
  @ApiResponse({ status: 201, description: 'Presigned URL generated' })
  presign(@Body() presignDto: PresignDto) {
    return this.attachmentsService.createPresignedUrl(presignDto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm upload and create DB record' })
  @ApiBody({ type: ConfirmDto })
  @ApiResponse({ status: 201, description: 'Attachment created' })
  confirm(@Body() confirmDto: ConfirmDto) {
    return this.attachmentsService.confirmUpload(confirmDto.objectKey, confirmDto.issueId);
  }
}