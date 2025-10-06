import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId?: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        organization: true,
        owner: true,
        boards: {
          include: {
            lists: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organization: true,
        owner: true,
        boards: {
          include: {
            lists: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(data: { name: string; description?: string; organizationId: string; ownerId: string }): Promise<Project> {
    return this.prisma.project.create({
      data,
      include: {
        organization: true,
        owner: true,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        organization: true,
        owner: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({ where: { id } });
  }

  async addMember(projectId: string, userId: string, roleId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Assuming removing all roles for the user in this project context, but since roles are global, perhaps remove specific.
    // For simplicity, remove UserRole for the user.
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });
  }
}