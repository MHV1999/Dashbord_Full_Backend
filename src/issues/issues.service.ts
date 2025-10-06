import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Issue } from '@prisma/client';

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, data: { title: string; description?: string; listId: string; assigneeId?: string }): Promise<Issue> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const list = await this.prisma.list.findUnique({ where: { id: data.listId } });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const maxPosition = await this.prisma.issue.findFirst({
      where: { listId: data.listId },
      orderBy: { position: 'desc' },
    });
    const position = maxPosition ? maxPosition.position + 1 : 0;

    return this.prisma.issue.create({
      data: {
        ...data,
        position,
      },
      include: {
        list: true,
        assignee: true,
      },
    });
  }

  async findAll(projectId: string, filters: { status?: string; assigneeId?: string; label?: string }, pagination: { skip?: number; take?: number }): Promise<Issue[]> {
    const where: any = {
      list: {
        board: {
          projectId,
        },
      },
    };

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    // Assuming status is derived from list position or something, but for simplicity, filter by listId if status provided
    // For now, skip status filter as it's not in schema

    return this.prisma.issue.findMany({
      where,
      include: {
        list: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Issue> {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        list: true,
        assignee: true,
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true,
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  async update(id: string, data: { title?: string; description?: string; listId?: string; assigneeId?: string }): Promise<Issue> {
    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    if (data.listId) {
      const list = await this.prisma.list.findUnique({ where: { id: data.listId } });
      if (!list) {
        throw new NotFoundException('List not found');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      return tx.issue.update({
        where: { id },
        data,
        include: {
          list: true,
          assignee: true,
        },
      });
    });
  }

  async remove(id: string): Promise<void> {
    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    await this.prisma.issue.delete({ where: { id } });
  }
}