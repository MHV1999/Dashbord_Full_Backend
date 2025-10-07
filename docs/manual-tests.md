# Manual Testing Guide with Postman

This guide provides step-by-step instructions for manually testing the API using Postman.

## Prerequisites

1. **Generate Postman Collection:**
   ```bash
   npm run build:swagger
   npm run export:postman
   ```

2. **Import Collection in Postman:**
   - Open Postman
   - Click "Import" button
   - Select "File" tab
   - Choose `postman_collection.json` from the project root
   - Click "Import"

## Authentication Flow

The API uses JWT tokens with refresh tokens stored in HttpOnly cookies for security.

### Test Flow: Login → Get Profile → Refresh Token → Logout

#### 1. Login (POST /auth/login)

**Request:**
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Notes:**
- The refresh token is automatically set as an HttpOnly cookie named `refresh_token`
- The access token should be used in the Authorization header for subsequent requests
- Cookie is set with `HttpOnly`, `Secure` (in production), `SameSite=lax`

#### 2. Get Current User (GET /auth/me)

**Request:**
```
GET http://localhost:3000/auth/me
Authorization: Bearer {{access_token}}
```

**Expected Response (200 OK):**
```json
{
  "id": "user_id_here",
  "email": "admin@example.com",
  "name": "Admin User"
}
```

**Notes:**
- Requires Bearer token in Authorization header
- Returns basic user information
- Protected route - returns 401 if token is invalid/expired

#### 3. Refresh Access Token (POST /auth/refresh)

**Request:**
```
POST http://localhost:3000/auth/refresh
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Notes:**
- No body required - uses refresh token from cookie
- Issues new access token and rotates refresh token
- Old refresh token is invalidated
- New refresh token is set in cookie

#### 4. Logout (POST /auth/logout)

**Request:**
```
POST http://localhost:3000/auth/logout
```

**Expected Response (200 OK):**
```json
{
  "message": "Logged out"
}
```

**Notes:**
- Revokes the current refresh token
- Clears the refresh_token cookie
- Access token remains valid until expiry

## Postman Environment Setup

Create a Postman environment with the following variables:

```json
{
  "base_url": "http://localhost:3000",
  "access_token": "",
  "refresh_token": ""
}
```

## Common Issues

### 401 Unauthorized
- Check if access token is set in Authorization header
- Verify token hasn't expired (15 minutes default)
- Ensure correct Bearer format: `Bearer <token>`

### Refresh Token Issues
- Refresh tokens are HttpOnly cookies - cannot be accessed via JavaScript
- Use browser dev tools to inspect cookies
- Refresh endpoint reads from cookie automatically

### Cookie Problems
- Ensure cookies are enabled in Postman settings
- Check cookie domain/path settings
- In production, cookies require HTTPS (Secure flag)

## Additional Test Cases

### Invalid Credentials
```
POST /auth/login
{
  "email": "wrong@example.com",
  "password": "wrongpass"
}
```
Expected: 401 Unauthorized

### Expired Token
Wait 15+ minutes after login, then call protected endpoint.
Expected: 401 Unauthorized

### Missing Refresh Cookie
Clear cookies, then call refresh endpoint.
Expected: 401 Unauthorized

## Environment Variables for Testing

Ensure your `.env` file has:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

## Running the Application

```bash
# Start database and Redis
docker-compose up -d postgres redis

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start application
npm run dev
```

The API will be available at `http://localhost:3000`