# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Sao chep file cau hinh va cai dat dependencies.
# (EN: Copy config files and install dependencies.)
COPY package.json ./
RUN npm install

# Sao chep toan bo source code.
# (EN: Copy all source code.)
COPY . .

# Build TypeScript thanh JavaScript.
# (EN: Compile TypeScript to JavaScript.)
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine

WORKDIR /app

# Chi copy file production can thiet.
# (EN: Copy only production-required files.)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port ma NestJS lang nghe.
# (EN: Expose port NestJS listens on.)
EXPOSE 3000

# Khoi chay ung dung production.
# (EN: Start production application.)
CMD ["node", "dist/main"]

# Build and push command:
# docker build -t starciacademy/sql-vs-nosql-backend:latest .
# docker push starciacademy/sql-vs-nosql-backend:latest
