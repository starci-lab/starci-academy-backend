import {
    INestApplication 
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    CorsOptions 
} from "@nestjs/common/interfaces/external/cors-options.interface"

/**
 * Outside production, any port on localhost is a legitimate origin: a dev server, a preview or a UAT
 * worktree may answer on any local port, and the API must admit it without a restart. In production
 * only the declared origins are admitted.
 */
export const LOCALHOST_ANY_PORT = /^https?:\/\/localhost:\d+$/

/**
 * Create cors options
 */
export const createCorsOptions = (): CorsOptions => ({
    origin: envConfig().isProduction
        ? envConfig().cors.origins
        : [...envConfig().cors.origins,
            LOCALHOST_ANY_PORT],
    credentials: true,
    methods: [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
    ],
})

/**
 * Setup cors for NestJS application
 */
export const setupCors = (app: INestApplication) => {
    app.enableCors(createCorsOptions())
}

