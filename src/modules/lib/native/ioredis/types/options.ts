import type {
    RedisOptions
} from "ioredis"
import type {
    IoRedisInstanceKey,
} from "../enums/instance-key"

/** Options for IoRedis module (instance keys). */
export interface IoRedisOptions {
    instanceKeys: Array<IoRedisInstanceKey>
}

/** Config for a single IoRedis instance key. */
export interface IoRedisInstanceKeyOptions {
    host: string
    port: number
    password: string
    useCluster: boolean
    additionalOptions?: RedisOptions
}
