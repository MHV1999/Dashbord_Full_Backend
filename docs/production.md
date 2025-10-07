# Production Deployment Guide

This guide covers deploying the NestJS backend application to production using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- Database backup/restore strategy

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database
POSTGRES_PASSWORD=your_secure_postgres_password

# JWT Secrets
JWT_ACCESS_SECRET=your_256_bit_access_secret
JWT_REFRESH_SECRET=your_256_bit_refresh_secret

# S3/MinIO Configuration
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_REGION=us-east-1
S3_BUCKET=your_bucket_name

# Optional MinIO (if using self-hosted S3)
MINIO_ROOT_USER=your_minio_admin_user
MINIO_ROOT_PASSWORD=your_minio_admin_password
```

## Deployment Steps

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create environment file:**
   ```bash
   cp .env.sample .env
   # Edit .env with your production values
   ```

3. **Build and start the services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run database migrations:**
   ```bash
   # Generate Prisma client
   docker-compose -f docker-compose.prod.yml exec app npx prisma generate

   # Run migrations
   docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

   # Optional: Seed the database
   docker-compose -f docker-compose.prod.yml exec app npm run seed
   ```

5. **Verify the deployment:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs app
   ```

## Database Management

### Backup
```bash
# Backup PostgreSQL database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U prod_user prod_db > backup.sql
```

### Restore
```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U prod_user prod_db < backup.sql
```

## Scaling

### Horizontal Scaling
- Use a load balancer (nginx, traefik) in front of multiple app instances
- Ensure Redis is shared across instances
- Use database connection pooling

### Database Scaling
- Consider using PostgreSQL replicas for read operations
- Implement database sharding if needed

## Monitoring

- Monitor application logs: `docker-compose -f docker-compose.prod.yml logs -f app`
- Database health: `docker-compose -f docker-compose.prod.yml exec postgres pg_isready`
- Redis health: `docker-compose -f docker-compose.prod.yml exec redis redis-cli ping`

## Security Considerations

- Use strong, unique passwords for all services
- Regularly rotate JWT secrets
- Keep Docker images updated
- Use HTTPS in production (configure reverse proxy)
- Implement rate limiting and security headers
- Regularly backup data and test restore procedures

## Troubleshooting

### Common Issues

1. **Database connection fails:**
   - Check POSTGRES_PASSWORD in .env
   - Ensure postgres service is healthy: `docker-compose -f docker-compose.prod.yml ps`

2. **Application won't start:**
   - Check logs: `docker-compose -f docker-compose.prod.yml logs app`
   - Verify environment variables are set correctly

3. **Migrations fail:**
   - Ensure database is accessible
   - Check migration files in prisma/migrations/

### Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# Follow app logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Updates

To update the application:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## Optional MinIO Setup

If using self-hosted S3-compatible storage:

1. Uncomment the minio service in `docker-compose.prod.yml`
2. Set MINIO_ROOT_USER and MINIO_ROOT_PASSWORD in .env
3. Access MinIO console at http://localhost:9001
4. Create a bucket and update S3_BUCKET in .env
5. Update S3_ACCESS_KEY and S3_SECRET_KEY with MinIO credentials