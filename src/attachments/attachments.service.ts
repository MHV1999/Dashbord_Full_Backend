import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Attachment } from '@prisma/client';

@Injectable()
export class AttachmentsService {
  private s3Client: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      // For MinIO, add endpoint: process.env.S3_ENDPOINT
    });
  }

  async createPresignedUrl(data: { issueId: string; filename: string; contentType: string; size: number }) {
    // Validate issue exists
    const issue = await this.prisma.issue.findUnique({ where: { id: data.issueId } });
    if (!issue) {
      throw new BadRequestException('Issue not found');
    }

    // Validate size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (data.size > maxSize) {
      throw new BadRequestException('File size exceeds limit');
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(data.contentType)) {
      throw new BadRequestException('Invalid file type');
    }

    const objectKey = `attachments/${data.issueId}/${Date.now()}-${data.filename}`;
    const bucket = process.env.S3_BUCKET!;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: data.contentType,
      ContentLength: data.size,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour

    const publicUrl = `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${objectKey}`;

    return {
      uploadUrl,
      objectKey,
      publicUrl,
    };
  }

  async confirmUpload(objectKey: string, issueId: string): Promise<Attachment> {
    // Validate issue exists
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new BadRequestException('Issue not found');
    }

    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${objectKey}`;

    return this.prisma.attachment.create({
      data: {
        url: publicUrl,
        issueId,
      },
    });
  }
}