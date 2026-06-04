/**
 * Root controller — health probe and available endpoint listing.
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
 * Class `AppController` — lesson lab component.
 */
export class AppController {
    /**
     * Minimal root probe — confirms API is running and lists demo endpoints.
     */
    @Public()
    @Get()
    /**
 * Logic — Business handler `health` for the lab.
 * Code — `health()` — in-class handler logic.
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
