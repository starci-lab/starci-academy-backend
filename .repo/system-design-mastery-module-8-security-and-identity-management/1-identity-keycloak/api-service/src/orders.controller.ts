/**
 * Protected orders controller — requires a valid Bearer token from Keycloak.
 */
import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    AuthenticatedUser,
} from "nest-keycloak-connect"

/**
 * Decoded payload from Keycloak JWT access token.
 */
type KeycloakUser = {
    preferred_username?: string
    email?: string
}

/**
 * Class `OrdersController` — lesson lab component.
 */
export class OrdersController {
    /**
     * Returns demo order list — only accessible with a valid Bearer token.
     */
    @Get()
    listOrders(@AuthenticatedUser() user: KeycloakUser): {
        status: string
        message: string
        data: Array<{ id: number; total: number }>
    } {
        const username = user?.preferred_username ?? user?.email ?? "user"
        return {
            status: "success",
            message: `Welcome ${username}. Here are your orders`,
            data: [
                { id: 1, total: 500 },
                { id: 2, total: 1000 },
            ],
        }
    }
}
