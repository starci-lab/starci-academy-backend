import {
    OnModuleDestroy,
    Provider 
} from "@nestjs/common"
import Redis from "ioredis"
import Valkey from "iovalkey"
import {
    createIoRedisKey 
} from "./constants"
import {
    IoRedisInstanceKey,
} from "./enums/instance-key"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    IoRedisInstanceKeyOptions,
} from "./types/options"
import type {
    RedisOrCluster,
    ValkeyOrCluster,
} from "./types/client"

type IoRedisClient = RedisOrCluster | ValkeyOrCluster

/** Own the lifecycle of a raw ioredis/iovalkey client registered by Nest. */
export class IoRedisClientShutdown implements OnModuleDestroy {
    constructor(private readonly client: IoRedisClient) { }

    async onModuleDestroy(): Promise<void> {
        if (this.client.status === "end") {
            return
        }
        await this.client.quit().catch(() => this.client.disconnect())
    }
}

const createIoRedisShutdownKey = (key: IoRedisInstanceKey): string =>
    `IOREDIS_SHUTDOWN_${key}`

/**
 * Builds the client for `key`: Cache -> Valkey (cluster-capable), others ->
 * ioredis. BullMQ/Throttler set `maxRetriesPerRequest: null` -- sharing a
 * vanilla client would hang blocking queue commands.
 */
export const createIoRedisProvider = (key: IoRedisInstanceKey): Provider => ({
    provide: createIoRedisKey(key),
    useFactory: (
    ) => {
        const map: Record<IoRedisInstanceKey, IoRedisInstanceKeyOptions> = {
            [IoRedisInstanceKey.BullMQ]: {
                host: envConfig().redis.bullmq.host,
                port: envConfig().redis.bullmq.port,
                password: envConfig().redis.bullmq.password,
                useCluster: envConfig().redis.bullmq.useCluster,
                additionalOptions: {
                    maxRetriesPerRequest: null,
                },
            },
            [IoRedisInstanceKey.Throttler]: {
                host: envConfig().redis.throttler.host,
                port: envConfig().redis.throttler.port,
                password: envConfig().redis.throttler.password,
                useCluster: envConfig().redis.throttler.useCluster,
                additionalOptions: {
                    maxRetriesPerRequest: null,
                },
            },
            [IoRedisInstanceKey.Adapter]: {
                host: envConfig().redis.adapter.host,
                port: envConfig().redis.adapter.port,
                password: envConfig().redis.adapter.password,
                useCluster: envConfig().redis.adapter.useCluster,
            },
            [IoRedisInstanceKey.Cache]: {
                host: envConfig().redis.cache.host,
                port: envConfig().redis.cache.port,
                password: envConfig().redis.cache.password,
                useCluster: envConfig().redis.cache.useCluster,
            },
        }
        const { host, port, password, useCluster, additionalOptions } = map[key]
        // use valkey if key === IoRedisInstanceKey.Cache
        if (useCluster) {
            if (key === IoRedisInstanceKey.Cache) {
                return new Valkey.Cluster(
                    [
                        {
                            host,
                            port,
                        }
                    ],
                    {
                        redisOptions: {
                            password,
                            enableAutoPipelining: true,
                        },
                    }
                )
            }
            return new Redis.Cluster(
                [
                    {
                        host,
                        port,
                    }
                ],
                {
                    redisOptions: {
                        password,
                        enableAutoPipelining: true,
                        ...additionalOptions,
                    },
                }
            )
        }
        if (key === IoRedisInstanceKey.Cache) {
            return new Valkey(
                {
                    host,
                    port,
                    password,
                }
            )
        }
        return new Redis(
            `redis://${host}:${port}`,
            {
                password,
                ...additionalOptions,
            }
        )
    },
})

/** Register the shutdown owner beside a raw ioredis/iovalkey provider. */
export const createIoRedisShutdownProvider = (key: IoRedisInstanceKey): Provider => ({
    provide: createIoRedisShutdownKey(key),
    inject: [createIoRedisKey(key)],
    useFactory: (client: IoRedisClient): IoRedisClientShutdown => new IoRedisClientShutdown(client),
})
