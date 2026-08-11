import {
    randomUUID,
} from "crypto"
import {
    Injectable,
} from "@nestjs/common"
import type Redis from "ioredis"
import {
    InjectIoRedis,
} from "@modules/lib/native/ioredis/ioredis.decorators"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    ConsumeOAuthStateParams,
    IssueOAuthStateParams,
} from "./types"

const CONSUME_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if value then
    redis.call("DEL", KEYS[1])
end
return value
`

@Injectable()
/**
 * Stores opaque OAuth state in Redis and atomically consumes it at callback.
 *
 * The get-and-delete operation is intentionally one Redis script. A separate
 * read followed by delete lets two concurrent callbacks both exchange the same
 * authorization flow, defeating the replay boundary that `state` is meant to
 * provide.
 */
export class OAuthStateService {
    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
    ) {}

    /** Issues an opaque state value bound to an internal payload. */
    async issue<T>({
        purpose,
        payload,
    }: IssueOAuthStateParams<T>): Promise<string> {
        const state = randomUUID()
        await this.redis.set(
            this.key(purpose,
                state),
            JSON.stringify(payload),
            "PX",
            envConfig().cache.ttl.keycloakOidcPkce,
        )
        return state
    }

    /** Atomically returns and deletes a state payload; replay returns undefined. */
    async consume<T>({
        purpose,
        state,
    }: ConsumeOAuthStateParams): Promise<T | undefined> {
        const serialized = await this.redis.eval(
            CONSUME_SCRIPT,
            1,
            this.key(purpose,
                state),
        )
        if (typeof serialized !== "string") {
            return undefined
        }
        return JSON.parse(serialized) as T
    }

    /** Builds a purpose-scoped key so one OAuth door cannot consume another's state. */
    private key(purpose: string, state: string): string {
        return `oauth-state:${purpose}:${state}`
    }
}
