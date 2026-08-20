import {
    OnModuleDestroy,
    Provider,
} from "@nestjs/common"
import {
    createClient, createCluster 
} from "redis"
import {
    createRedisKey 
} from "./constants"
import {
    RedisInstanceKey,
} from "./enums/instance-key"
import {
    RedisInstanceKeyOptions,
} from "./types/options"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    RedisClient,
} from "./types/client"

/**
 * Nest does not run shutdown hooks on a raw Redis client returned by a
 * `useFactory` provider. Keep the client provider raw for existing consumers,
 * and register this small lifecycle owner beside it so app.close() also closes
 * the socket opened by Keyv/cache-manager.
 */
class RedisClientShutdown implements OnModuleDestroy {
    constructor(private readonly client: RedisClient) { }

    async onModuleDestroy(): Promise<void> {
        if ("isOpen" in this.client && !this.client.isOpen) {
            return
        }
        await this.client.quit()
    }
}

const createRedisShutdownKey = (key: RedisInstanceKey): string =>
    `REDIS_SHUTDOWN_${key}`

/**
 * Builds a node-redis standalone or cluster client from env for `key`.
 * Cluster vs single is per-role -- forcing one mode breaks the other deploy.
 */
export const createRedisProvider = (key: RedisInstanceKey): Provider => ({
    provide: createRedisKey(key),
    useFactory: async () => {
        const map: Record<RedisInstanceKey, RedisInstanceKeyOptions> = {
            [RedisInstanceKey.BullMQ]: {
                host: envConfig().redis.bullmq.host,
                port: envConfig().redis.bullmq.port,
                password: envConfig().redis.bullmq.password,
                useCluster: envConfig().redis.bullmq.useCluster,
            },
            [RedisInstanceKey.Throttler]: {
                host: envConfig().redis.throttler.host,
                port: envConfig().redis.throttler.port,
                password: envConfig().redis.throttler.password,
                useCluster: envConfig().redis.throttler.useCluster,
            },
            [RedisInstanceKey.Adapter]: {
                host: envConfig().redis.adapter.host,
                port: envConfig().redis.adapter.port,
                password: envConfig().redis.adapter.password,
                useCluster: envConfig().redis.adapter.useCluster,
            },
            [RedisInstanceKey.Cache]: {
                host: envConfig().redis.cache.host,
                port: envConfig().redis.cache.port,
                password: envConfig().redis.cache.password,
                useCluster: envConfig().redis.cache.useCluster,
            },
        }
        const { 
            host, 
            port, 
            password, 
            useCluster,
            additionalOptions
        } = map[key]
        if (useCluster) {
            const cluster = createCluster({
                rootNodes: [
                    {
                        socket: {
                            host,
                            port,
                        },
                    },
                ],
                defaults: {
                    password,
                    ...additionalOptions,
                },
            })
            return cluster
        }       
        const client = createClient({
            socket: {
                host,
                port,
            },
            password,
            ...additionalOptions,
        })
        return client
    },
})

/** Register the shutdown owner for a raw node-redis client provider. */
export const createRedisShutdownProvider = (key: RedisInstanceKey): Provider => ({
    provide: createRedisShutdownKey(key),
    inject: [createRedisKey(key)],
    useFactory: (client: RedisClient): RedisClientShutdown => new RedisClientShutdown(client),
})
