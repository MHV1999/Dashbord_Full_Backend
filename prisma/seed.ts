import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create permissions
  const permissions = [
    { name: 'read', description: 'Read access' },
    { name: 'write', description: 'Write access' },
    { name: 'create', description: 'Create access' },
    { name: 'update', description: 'Update access' },
    { name: 'delete', description: 'Delete access' },
    { name: 'manage_users', description: 'Manage users' },
    { name: 'manage_projects', description: 'Manage projects' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.create({
      data: perm,
    });
    createdPermissions.push(permission);
  }

  // Create roles
  const roles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'manager', description: 'Manager with project management access' },
    { name: 'developer', description: 'Developer with read/write access' },
    { name: 'viewer', description: 'Viewer with read-only access' },
  ];

  const createdRoles = [];
  for (const roleData of roles) {
    const role = await prisma.role.create({
      data: roleData,
    });
    createdRoles.push(role);
  }

  const [adminRole, managerRole, developerRole, viewerRole] = createdRoles;
  const [readPerm, writePerm, createPerm, updatePerm, deletePerm, manageUsersPerm, manageProjectsPerm] = createdPermissions;

  // Assign permissions to roles
  const rolePermissions = [
    // Admin: all permissions
    { role: adminRole, perms: [readPerm, writePerm, createPerm, updatePerm, deletePerm, manageUsersPerm, manageProjectsPerm] },
    // Manager: most permissions except manage users
    { role: managerRole, perms: [readPerm, writePerm, createPerm, updatePerm, deletePerm, manageProjectsPerm] },
    // Developer: read, write, create, update
    { role: developerRole, perms: [readPerm, writePerm, createPerm, updatePerm] },
    // Viewer: read only
    { role: viewerRole, perms: [readPerm] },
  ];

  for (const { role, perms } of rolePermissions) {
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Create users
  const usersData = [
    { email: 'admin@example.com', name: 'Admin User', password: 'admin123', role: adminRole },
    { email: 'manager@example.com', name: 'Manager User', password: 'manager123', role: managerRole },
    { email: 'dev@example.com', name: 'Developer User', password: 'dev123', role: developerRole },
    { email: 'viewer@example.com', name: 'Viewer User', password: 'viewer123', role: viewerRole },
  ];

  const createdUsers = [];
  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
      },
    });
    createdUsers.push(user);

    // Assign role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: userData.role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: userData.role.id,
      },
    });
  }

  const [adminUser, managerUser, devUser, viewerUser] = createdUsers;

  // Create organizations
  const orgsData = [
    { name: 'TechCorp', owner: adminUser },
    { name: 'InnovateInc', owner: managerUser },
  ];

  const createdOrgs = [];
  for (const orgData of orgsData) {
    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        ownerId: orgData.owner.id,
      },
    });
    createdOrgs.push(org);
  }

  const [techCorp, innovateInc] = createdOrgs;

  // Create projects
  const projectsData = [
    { name: 'Project Alpha', description: 'Main project for TechCorp', org: techCorp, owner: adminUser },
    { name: 'Project Beta', description: 'Secondary project for TechCorp', org: techCorp, owner: managerUser },
    { name: 'Project Gamma', description: 'Innovation project', org: innovateInc, owner: managerUser },
    { name: 'Project Delta', description: 'Development project', org: innovateInc, owner: devUser },
  ];

  const createdProjects = [];
  for (const projData of projectsData) {
    const project = await prisma.project.create({
      data: {
        name: projData.name,
        description: projData.description,
        organizationId: projData.org.id,
        ownerId: projData.owner.id,
      },
    });
    createdProjects.push(project);
  }

  const [alpha, beta, gamma, delta] = createdProjects;

  // Create boards
  const boardsData = [
    { name: 'Development Board', project: alpha },
    { name: 'Testing Board', project: alpha },
    { name: 'Feature Board', project: beta },
    { name: 'Bug Board', project: beta },
    { name: 'Innovation Board', project: gamma },
    { name: 'Research Board', project: gamma },
    { name: 'Dev Board', project: delta },
    { name: 'Review Board', project: delta },
  ];

  const createdBoards = [];
  for (const boardData of boardsData) {
    const board = await prisma.board.create({
      data: {
        name: boardData.name,
        projectId: boardData.project.id,
      },
    });
    createdBoards.push(board);
  }

  // Create lists for each board
  const listNames = ['To Do', 'In Progress', 'Review', 'Done'];
  const createdLists = [];
  for (const board of createdBoards) {
    for (let i = 0; i < listNames.length; i++) {
      const list = await prisma.list.create({
        data: {
          name: listNames[i],
          boardId: board.id,
          position: i,
        },
      });
      createdLists.push(list);
    }
  }

  // Create issues
  const issuesData = [
    { title: 'Implement user authentication', description: 'Add JWT auth system', list: createdLists[0], assignee: devUser },
    { title: 'Design database schema', description: 'Create Prisma schema', list: createdLists[1], assignee: adminUser },
    { title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions', list: createdLists[2], assignee: managerUser },
    { title: 'Write unit tests', description: 'Add test coverage', list: createdLists[3], assignee: devUser },
    { title: 'Create API documentation', description: 'Generate Swagger docs', list: createdLists[4], assignee: viewerUser },
    { title: 'Optimize database queries', description: 'Improve performance', list: createdLists[5], assignee: devUser },
    { title: 'Implement file upload', description: 'Add S3 integration', list: createdLists[6], assignee: adminUser },
    { title: 'Add user roles', description: 'Implement RBAC', list: createdLists[7], assignee: managerUser },
    { title: 'Fix login bug', description: 'Resolve authentication issue', list: createdLists[8], assignee: devUser },
    { title: 'Update dependencies', description: 'Upgrade packages', list: createdLists[9], assignee: adminUser },
    { title: 'Add dark mode', description: 'Implement theme toggle', list: createdLists[10], assignee: viewerUser },
    { title: 'Setup monitoring', description: 'Add logging and metrics', list: createdLists[11], assignee: managerUser },
    { title: 'Create admin panel', description: 'Build management interface', list: createdLists[12], assignee: adminUser },
    { title: 'Implement notifications', description: 'Add real-time updates', list: createdLists[13], assignee: devUser },
    { title: 'Write API tests', description: 'Add integration tests', list: createdLists[14], assignee: devUser },
    { title: 'Setup deployment', description: 'Configure production env', list: createdLists[15], assignee: managerUser },
    { title: 'Add search functionality', description: 'Implement global search', list: createdLists[16], assignee: viewerUser },
    { title: 'Create user guide', description: 'Write documentation', list: createdLists[17], assignee: adminUser },
    { title: 'Implement caching', description: 'Add Redis integration', list: createdLists[18], assignee: devUser },
    { title: 'Add email notifications', description: 'Send automated emails', list: createdLists[19], assignee: managerUser },
  ];

  for (const issueData of issuesData) {
    await prisma.issue.create({
      data: {
        title: issueData.title,
        description: issueData.description,
        listId: issueData.list.id,
        position: Math.floor(Math.random() * 10),
        assigneeId: issueData.assignee?.id,
      },
    });
  }

  console.log('Seeding completed with demo data');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });