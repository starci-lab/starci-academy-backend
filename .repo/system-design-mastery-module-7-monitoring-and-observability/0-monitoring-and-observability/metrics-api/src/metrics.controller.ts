/**
 * Controller expose endpoint Prometheus scrape `/metrics`.
 * (EN: Controller exposing Prometheus scrape endpoint `/metrics`.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    registry,
} from "./prometheus"

@Controller()
/**
 * Class `MetricsController` — lesson lab component.
 */
export class MetricsController {
    /**
     * Returns Prometheus text exposition snapshot.
     */
    @Get("metrics")
/**
 * Logic: Business handler `metrics` for the lab.
 * Code: `async metrics()` — uses injected deps / clients.
 */
    async metrics(): Promise<string> {
        return registry.metrics()
    }
}
