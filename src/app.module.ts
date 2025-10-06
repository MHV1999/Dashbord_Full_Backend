import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProjectsModule } from './projects/projects.module';
import { BoardsModule } from './boards/boards.module';
import { ListsModule } from './lists/lists.module';
import { IssuesModule } from './issues/issues.module';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule, RolesModule, PermissionsModule, ProjectsModule, BoardsModule, ListsModule, IssuesModule],
})
export class AppModule {}