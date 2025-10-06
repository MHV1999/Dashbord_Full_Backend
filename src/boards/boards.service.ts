import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Board } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string): Promise<Board[]> {
    return this.prisma.board.findMany({
      where: projectId ? { projectId } : {},
      include: {
        project: true,
        lists: true,
      },
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        project: true,
        lists: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async create(data: { name: string; projectId: string }): Promise<Board> {
    return this.prisma.board.create({
      data,
      include: {
        project: true,
      },
    });
  }

  async update(id: string, data: { name?: string }): Promise<Board> {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.board.update({
      where: { id },
      data,
      include: {
        project: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.prisma.board.delete({ where: { id } });
  }
}