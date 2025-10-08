# Stage 1: Install production dependencies (for final image)
FROM node:18-slim AS deps
WORKDIR /app
COPY package*.json ./
# install only production deps for the final runtime image
RUN npm ci --omit=dev

# Stage 2: Build (install full deps for building)
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
# install dev deps to be able to build (TypeScript compile, etc.)
RUN npm ci
COPY . .
# generate Prisma client
RUN npx prisma generate
# build the project (assumes "build" script compiles to dist/)
RUN npm run build

# Stage 3: Production image (small, prod deps only)
FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for Prisma compatibility
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# copy generated Prisma client from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# copy built artifacts
COPY --from=builder /app/dist ./dist
# copy package.json for completeness (optional)
COPY --from=builder /app/package*.json ./

# Create a non-root user for runtime (best practice)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
# ensure proper ownership
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
