/**
 * Bootstrap Nest HTTP/microservice — ValidationPipe + listen.
 * (EN: Nest bootstrap — ValidationPipe and listen.)
 */
import {
  NestFactory,
} from "@nestjs/core"
import {
  ConfigService,
} from "@nestjs/config"
import { AppModule } from "./app.module"
import type {
  AppConfig,
} from "./config"

/**
 * Khởi chạy Ecommerce App với cấu hình từ ConfigModule.
 * (EN: Bootstrap Ecommerce App with ConfigModule-driven runtime config.)
 */
export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const appRuntime = config.getOrThrow<AppConfig>("app")
  await app.listen(appRuntime.port, "0.0.0.0")
}
