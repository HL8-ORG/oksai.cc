# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json ./

# Copy all package.json files for dependency resolution
COPY apps/gateway/package.json ./apps/gateway/
COPY libs/shared/types/package.json ./libs/shared/types/
COPY libs/shared/utils/package.json ./libs/shared/utils/
COPY libs/database/package.json ./libs/database/
COPY libs/auth/nestjs-better-auth/package.json ./libs/auth/nestjs-better-auth/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/gateway ./apps/gateway
COPY libs ./libs

# Build workspace libs first
RUN pnpm nx run-many -t build -p @oksai/types @oksai/utils @oksai/database @oksai/nestjs-better-auth

# Build the gateway app
RUN pnpm nx build @oksai/gateway

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built app and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/apps/gateway/main.js"]
