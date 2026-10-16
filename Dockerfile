FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN npm install

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/
RUN npm run build -w packages/shared && npm run build -w apps/server

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/apps/server/package.json apps/server/
RUN npm install --omit=dev
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/server/dist apps/server/dist

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "apps/server/dist/index.js"]
