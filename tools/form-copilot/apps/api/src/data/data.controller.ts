import { BadRequestException, Body, Controller, Get, Inject, Post, Put, Query } from "@nestjs/common";
import { ProfileSchema } from "@form-copilot/contracts";
import { z, ZodError } from "zod";
import { DatabaseService } from "./database.service.js";

@Controller("api")
export class DataController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  @Get("profile") async profile() { return { profile: await this.database.getProfile() }; }
  @Put("profile") async saveProfile(@Body() body: unknown) {
    try { const profile = ProfileSchema.parse(body); await this.database.setProfile(profile); return { saved: true, profile }; }
    catch (error) { if (error instanceof ZodError) throw new BadRequestException({ error: "INVALID_PROFILE", issues: error.issues }); throw error; }
  }
  @Get("history") history(@Query("limit") rawLimit: string | undefined) {
    const limit = z.coerce.number().int().min(1).max(100).catch(30).parse(rawLimit);
    return this.database.history(limit).then((items) => ({ items }));
  }
  @Post("privacy/clear") async clear(@Body() body: unknown) {
    const parsed = z.object({ confirmation: z.literal("DELETE LOCAL DATA") }).safeParse(body);
    if (!parsed.success) throw new BadRequestException("Exact confirmation is required");
    await this.database.clear(); return { cleared: true };
  }
}
