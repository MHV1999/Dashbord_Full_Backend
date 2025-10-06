import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany: jest.fn(), findUnique: jest.fn() },
            auditLog: { findMany: jest.fn(), create: jest.fn() },
          },
        },
        {
          provide: AuthService,
          useValue: {
            createAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests here
});