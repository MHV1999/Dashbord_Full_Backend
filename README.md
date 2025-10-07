# Backend API

This is an API-first backend built with NestJS, TypeScript, and Node.js.

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Copy `.env.sample` to `.env` and fill in the values.

3. Run Prisma migrations:
   ```
   npm run prisma:generate
   npm run migrate
   npm run prisma:migrate:dev
   ```

4. Seed the database (optional):
   ```
   npm run seed
   ```

5. Start the development server:
   ```
   npm run dev
   ```

The server will be running on http://localhost:3000

## Using Docker Compose

1. Build and run the services:
   ```
   docker-compose up --build
   ```

This will start the app, PostgreSQL, and Redis.

## Verification Checklist

After setup, run the verification script:

```bash
./scripts/verify-setup.sh
```

This will check:
- ✅ Application is running on the configured port
- ✅ Swagger documentation is accessible
- ✅ Swagger JSON file exists

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing
See [docs/manual-tests.md](docs/manual-tests.md) for Postman testing guide.

## Production Deployment

See [docs/production.md](docs/production.md) for production deployment guide.

## API Documentation

Once running, access Swagger docs at: http://localhost:3000/api

## Project Structure

```
src/
├── auth/                 # Authentication module
├── prisma/               # Database service
├── users/                # User management
├── roles/                # Role management
├── permissions/          # Permission management
├── projects/             # Project management
├── boards/               # Board management
├── lists/                # List management
├── issues/               # Issue management
├── comments/             # Comment management
├── attachments/          # File attachment handling
├── realtime/             # WebSocket gateway
└── admin/                # Admin panel

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding

docs/
├── production.md         # Production deployment
└── manual-tests.md       # Manual testing guide

scripts/
├── git-commit.sh         # Git commit helper
├── export-swagger.ts     # Swagger export script
└── verify-setup.sh       # Setup verification
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run e2e tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run Prisma migrations in dev
- `npm run migrate` - Deploy Prisma migrations
- `npm run seed` - Seed database
- `npm run build:swagger` - Build and export Swagger docs
- `npm run export:postman` - Export Postman collection