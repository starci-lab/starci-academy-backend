import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { FixedRepository } from "./fixed/repository.js";

@Controller("api")
export class AppController {
  constructor(@Inject(FixedRepository) private readonly repository: FixedRepository) {}
  @Get("health") async health() {
    if (!await this.repository.health()) throw new ServiceUnavailableException("Database is unavailable");
    return { ok: true, status: "ok", version: "0.2.0" };
  }
}
