# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Sao chép file cấu hình và cài đặt dependencies (EN: copy config and install dependencies)
COPY package.json ./
RUN npm install

# Sao chép toàn bộ source code (EN: copy all source code)
COPY . .

# Build TypeScript thành JavaScript (EN: compile TypeScript to JavaScript)
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine

WORKDIR /app

# Chỉ copy file production cần thiết (EN: copy only production-required files)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port mà NestJS lắng nghe (EN: expose port NestJS listens on)
EXPOSE 3000

# Khởi chạy ứng dụng production (EN: start production application)
CMD ["node", "dist/main"]

# Build and push command:
# docker build -t starciacademy/core-concepts-and-metrics-status-service:latest .
# docker push starciacademy/core-concepts-and-metrics-status-service:latest
