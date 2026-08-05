import {
    Inject 
} from "@nestjs/common"
import {
    createRedisKey 
} from "./constants"
import {
    RedisInstanceKey,
} from "./enums/instance-key"

/**
 * Injects the node-redis client for `key`. Wrong key binds a feature to the
 * wrong Redis role (cache vs adapter vs queue).
 */
export const InjectRedis = (key: RedisInstanceKey) => Inject(createRedisKey(key))
