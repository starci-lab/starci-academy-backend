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
 * Class `MetricsController` — thành phần lab (controller/service/module).
 * (EN: Class `MetricsController` — lesson lab component.)
 */
export class MetricsController {
    /**
     * Trả về snapshot metric định dạng Prometheus text exposition.
     * (EN: Returns Prometheus text exposition snapshot.)
     */
    @Get("metrics")/**
 * Logic — Xử lý nghiệp vụ `metrics` cho lab.
 * Code — `async metrics()` — gọi dependency inject / client.
 * (EN Logic: Business handler `metrics` for the lab.)
 * (EN Code: `async metrics()` — uses injected deps / clients.)
 */
    async metrics(): Promise<string> {
        return registry.metrics()
    }
}
