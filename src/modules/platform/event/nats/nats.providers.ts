import type {
    Provider 
} from "@nestjs/common"
import {
    connect 
} from "nats"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    NATS,
} from "./constants/nats"

/**
 * Creates a provider for the NATS connection.
 *
 * @returns Provider that creates and connects to NATS
 *
 * @example
 * Used internally by NatsModule.register().
 */
export const createNatsProvider = (): Provider => ({
    provide: NATS,
    inject: [],
    useFactory: async () => {
        const cfg = envConfig().nats
        return await connect({
            servers: cfg.servers.map(server => `nats://${server.host}:${server.port}`),
            reconnect: cfg.reconnect,
            maxReconnectAttempts: cfg.maxReconnectAttempts,
            pingInterval: cfg.pingIntervalMs,
            // generous initial-dial timeout: the boot-time handshake can race a
            // saturated event loop, where the default (short) timeout spuriously
            // fails and crash-loops boot.
            timeout: cfg.connectTimeoutMs,
            token: cfg.auth.enabled ? cfg.auth.token : undefined,
        })
    },
})
