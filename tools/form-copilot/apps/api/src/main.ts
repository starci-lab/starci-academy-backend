import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { appConfig } from "./config.js";
import { dashboardSecurity } from "./security/dashboard-security.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.enableShutdownHooks();
  app.use(dashboardSecurity({ username: appConfig.authUser, password: appConfig.authPassword, allowedOrigins: appConfig.publicOrigins }));
  app.enableCors({ origin: appConfig.publicOrigins, methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"], credentials: true });
  await app.listen(appConfig.port, appConfig.host);
  console.log(`Form Copilot API: http://${appConfig.host}:${appConfig.port}`);
  console.log("Fixed-form scheduler: answers come from the labelled dataset; no AI execution path.");
}

void bootstrap();
