import {
    Inject 
} from "@nestjs/common"
import {
    createIoRedisKey 
} from "./constants"
import {
    IoRedisInstanceKey,
} from "./enums/instance-key"

/**
 * Injects the IoRedis/Valkey client for `key`. Wrong key -> wrong Redis
 * (e.g. cache eviction wiping BullMQ jobs).
 */
export const InjectIoRedis = (key: IoRedisInstanceKey) => Inject(createIoRedisKey(key))