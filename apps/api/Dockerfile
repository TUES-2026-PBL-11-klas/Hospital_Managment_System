FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/trpc/package.json ./packages/trpc/
RUN npm install --workspace=@medinest/api --workspace=@medinest/trpc

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@medinest/trpc
RUN npx prisma generate
RUN npm run build --workspace=@medinest/trpc
RUN npm run build --workspace=@medinest/api

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
