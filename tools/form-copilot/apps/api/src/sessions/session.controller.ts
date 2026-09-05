import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Res } from "@nestjs/common";
import { AnalyzeRequestSchema, ApplyRequestSchema, OpenSessionRequestSchema, SyntheticBatchRequestSchema } from "@form-copilot/contracts";
import type { Response } from "express";
import { ZodError, type ZodType } from "zod";
import { SessionService } from "./session.service.js";

function parse<T>(schema: ZodType<T>, value: unknown): T {
  try { return schema.parse(value); }
  catch (error) {
    if (error instanceof ZodError) throw new BadRequestException({ error: "INVALID_INPUT", issues: error.issues });
    throw error;
  }
}

@Controller("api/sessions")
export class SessionController {
  constructor(@Inject(SessionService) private readonly sessions: SessionService) {}
  @Post() open(@Body() body: unknown) { return this.sessions.open(parse(OpenSessionRequestSchema, body).url); }
  @Post(":id/scan") scan(@Param("id") id: string) { return this.sessions.scan(id); }
  @Post(":id/analyze") analyze(@Param("id") id: string, @Body() body: unknown) { return this.sessions.analyze(id, parse(AnalyzeRequestSchema, body)); }
  @Post(":id/synthetic-batch") syntheticBatch(@Param("id") id: string, @Body() body: unknown) { return this.sessions.syntheticBatch(id, parse(SyntheticBatchRequestSchema, body)); }
  @Post(":id/apply") apply(@Param("id") id: string, @Body() body: unknown) { return this.sessions.apply(id, parse(ApplyRequestSchema, body)); }
  @Get(":id/screenshot") async screenshot(@Param("id") id: string, @Res() response: Response) { response.type("png").setHeader("Cache-Control", "no-store").send(await this.sessions.screenshot(id)); }
  @Delete(":id") async close(@Param("id") id: string) { await this.sessions.close(id); return { closed: true }; }
}
