import { BadRequestException, Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { FixedCreateBatchSchema, FixedRetryJobSchema } from "@form-copilot/contracts";
import { FixedService } from "./service.js";

@Controller("api/fixed")
export class FixedController {
  constructor(@Inject(FixedService) private readonly service: FixedService) {}
  @Get("meta") meta() { return this.service.meta(); }
  @Get("reconciliation") reconciliation() { return this.service.reconciliation(); }
  @Get("batches") async list() { return { items: await this.service.listBatches() }; }
  @Post("batches") create(@Body() body: unknown) {
    const result = FixedCreateBatchSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
    return this.service.createBatch(result.data);
  }
  @Get("batches/:id") detail(@Param("id", new ParseUUIDPipe()) id: string) { return this.service.getBatch(id); }
  @Post("batches/:id/pause") pause(@Param("id", new ParseUUIDPipe()) id: string) { return this.service.transition(id, "pause"); }
  @Post("batches/:id/resume") resume(@Param("id", new ParseUUIDPipe()) id: string) { return this.service.transition(id, "resume"); }
  @Post("batches/:id/cancel") cancel(@Param("id", new ParseUUIDPipe()) id: string) { return this.service.transition(id, "cancel"); }
  @Post("jobs/:id/retry") retry(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const result = FixedRetryJobSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
    return this.service.retryJob(id, result.data.requestId);
  }
}
