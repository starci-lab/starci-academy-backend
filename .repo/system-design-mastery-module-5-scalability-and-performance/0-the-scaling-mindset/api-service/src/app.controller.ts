/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import {
    Body, Controller, Get, Post
} from "@nestjs/common"

@Controller()
/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
export class AppController {
    /**
     * Endpoint tối giản để ddos-service bắn GET (EN: minimal endpoint for the ddos-service GET generator).
     *
     * @returns Payload JSON cố định (EN: fixed JSON payload).
     */
    @Get()/**
 * Logic — Xử lý nghiệp vụ `root` cho lab.
 * Code — `root()` — logic trong service/controller.
 * (EN Logic: Business handler `root` for the lab.)
 * (EN Code: `root()` — in-class handler logic.)
 */
    root(): { ok: boolean; service: string } {
        return {
            ok: true, service: "api-service"
        }
    }
}
