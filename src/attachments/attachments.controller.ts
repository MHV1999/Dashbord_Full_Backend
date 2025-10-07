import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
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

const uploadFileOptions = {
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024) },
  fileFilter: (req: any, file: Express.Multer.File, cb: Function) => {
    const allowed = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file type'), false);
    }
    cb(null, true);
  },
};

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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', uploadFileOptions))
  @ApiOperation({ summary: 'Upload file directly' })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  async upload(@UploadedFile() file: Express.Multer.File, @Body() body: { issueId: string }) {
    if (!file) throw new BadRequestException('No file provided');
    return this.attachmentsService.createFromFile(file, body.issueId);
  }
}