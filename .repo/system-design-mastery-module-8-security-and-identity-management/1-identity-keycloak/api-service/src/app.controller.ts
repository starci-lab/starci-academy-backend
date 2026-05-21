/**
 * Controller gốc — health probe và danh sách endpoint khả dụng.
 * (EN: Root controller — health probe and available endpoint listing.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    Public,
} from "nest-keycloak-connect"
import type {
    HealthResponse,
} from "./types"

/**
 * Class `AppController` — thành phần lab (controller/service/module).
 * (EN: Class `AppController` — lesson lab component.)
 */
export class AppController {
    /**
     * Điểm vào tối giản — xác nhận API đang chạy và liệt kê endpoint demo.
     * (EN: Minimal root probe — confirms API is running and lists demo endpoints.)
     */
    @Public()
    @Get()
    /**
 * Logic — Xử lý nghiệp vụ `health` cho lab.
 * Code — `health()` — logic trong service/controller.
 * (EN Logic: Business handler `health` for the lab.)
 * (EN Code: `health()` — in-class handler logic.)
 */
    health(): HealthResponse {
        return {
            status: "ok",
            message: "Identity Keycloak NestJS demo is running.",
            endpoints: {
                loginPublic: "POST /auth/login/public",
                loginPrivate: "POST /auth/login/private",
                authorizeUrl: "GET /auth/authorize/url",
                authCallback: "GET /auth/callback?code=...",
                protectedOrders: "GET /api/orders (requires Bearer token)",
            },
        }
    }
}
