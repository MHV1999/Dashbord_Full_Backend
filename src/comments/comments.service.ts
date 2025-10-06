import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(issueId: string, userId: string, content: string): Promise<Comment> {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return this.prisma.comment.create({
      data: {
        content,
        issueId,
        userId,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll(issueId: string): Promise<Comment[]> {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return this.prisma.comment.findMany({
      where: { issueId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}