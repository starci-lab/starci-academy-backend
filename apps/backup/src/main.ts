import { NestFactory } from '@nestjs/core';
import { BackupModule } from './backup.module';

async function bootstrap() {
  const app = await NestFactory.create(BackupModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
