import { Module } from "@nestjs/common";
import { FixedController } from "./controller.js";
import { FixedRepository } from "./repository.js";
import { FixedService } from "./service.js";

@Module({ controllers: [FixedController], providers: [FixedRepository, FixedService], exports: [FixedRepository] })
export class FixedModule {}
