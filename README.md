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