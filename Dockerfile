FROM node:22-alpine AS deps
RUN apk add --no-cache gcompat
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
  else echo "No lockfile found" && exit 1; fi

FROM node:22-alpine AS builder
ARG APP_ENV
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /usr/app
ARG APP_ENV

COPY --from=builder /app/build ./build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

USER node
ENV NODE_ENV="production"
CMD ["node", "build/index.js"]