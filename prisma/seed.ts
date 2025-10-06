import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create basic roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role with full access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user role',
    },
  });

  // Create basic permissions
  const readPermission = await prisma.permission.upsert({
    where: { name: 'read' },
    update: {},
    create: {
      name: 'read',
      description: 'Read access',
    },
  });

  const writePermission = await prisma.permission.upsert({
    where: { name: 'write' },
    update: {},
    create: {
      name: 'write',
      description: 'Write access',
    },
  });

  // Assign permissions to admin role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: readPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: readPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: writePermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: writePermission.id,
    },
  });

  // Assign read permission to user role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: readPermission.id,
      },
    },
    update: {},
    create: {
      roleId: userRole.id,
      permissionId: readPermission.id,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10); // Placeholder: replace with secure password

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });