import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { List } from '@prisma/client';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async findAll(boardId?: string): Promise<List[]> {
    return this.prisma.list.findMany({
      where: boardId ? { boardId } : {},
      include: {
        board: true,
        issues: true,
      },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string): Promise<List> {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: {
        board: true,
        issues: true,
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return list;
  }

  async create(data: { name: string; boardId: string; position?: number }): Promise<List> {
    const maxPosition = await this.prisma.list.findFirst({
      where: { boardId: data.boardId },
      orderBy: { position: 'desc' },
    });
    const position = data.position ?? (maxPosition ? maxPosition.position + 1 : 0);

    return this.prisma.list.create({
      data: { ...data, position },
      include: {
        board: true,
      },
    });
  }

  async update(id: string, data: { name?: string; position?: number }): Promise<List> {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    return this.prisma.list.update({
      where: { id },
      data,
      include: {
        board: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.prisma.list.delete({ where: { id } });
  }

  async updatePosition(id: string, newPosition: number): Promise<List> {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Update positions
    await this.prisma.$transaction(async (tx) => {
      if (newPosition > list.position) {
        await tx.list.updateMany({
          where: {
            boardId: list.boardId,
            position: { gt: list.position, lte: newPosition },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        await tx.list.updateMany({
          where: {
            boardId: list.boardId,
            position: { gte: newPosition, lt: list.position },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.list.update({
        where: { id },
        data: { position: newPosition },
      });
    });

    return this.findOne(id);
  }
}