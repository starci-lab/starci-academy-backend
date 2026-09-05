import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AppController } from "./app.controller.js";
import { FixedModule } from "./fixed/module.js";

const webDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist");

@Module({
  imports: [FixedModule, ServeStaticModule.forRoot({ rootPath: webDist, exclude: ["/api/{*path}"] })],
  controllers: [AppController],
})
export class AppModule {}
