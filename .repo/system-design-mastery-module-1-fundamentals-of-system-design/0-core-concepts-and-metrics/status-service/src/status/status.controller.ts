import {
    Controller,
    Get,
    Query,
} from "@nestjs/common"
import { StatusService } from "./status.service"

@Controller("api")
export class StatusController {
    constructor(private readonly statusService: StatusService) {}

    @Get("status")
    getStatus(): ReturnType<StatusService["getStatus"]> {
        return this.statusService.getStatus()
    }

    @Get("heavy")
    handleHeavyTask(@Query("load") load: string) {
        const iterations = parseInt(load, 10) || 10_000_000
        return this.statusService.runHeavyCalculation(iterations)
    }

    @Get("metrics")
    getMetrics(): ReturnType<StatusService["getMetrics"]> {
        return this.statusService.getMetrics()
    }
}
