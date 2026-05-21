# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/main"]

# Build and push command:
# docker build -t starciacademy/scaling-strategies-scaling-service:latest .
# docker push starciacademy/scaling-strategies-scaling-service:latest
