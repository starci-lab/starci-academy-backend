/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"

@Controller()
/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
export class AppController {
    /**
     * Điểm vào tối giản để kiểm tra app sống (EN: minimal root probe).
     */
    @Get()/**
 * Logic — Xử lý nghiệp vụ `root` cho lab.
 * Code — `root()` — logic trong service/controller.
 * (EN Logic: Business handler `root` for the lab.)
 * (EN Code: `root()` — in-class handler logic.)
 */
    root(): { service: string } {
        return { service: "data-bottleneck-api-service" }
    }
}
