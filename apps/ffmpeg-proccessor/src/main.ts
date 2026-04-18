import { NestFactory } from '@nestjs/core';
import { FfmpegServiceModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(FfmpegServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
