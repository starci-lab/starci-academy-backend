/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import * as os from "os"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class RateLimitService {
    private readonly logger = new Logger(RateLimitService.name)

/**
 * Logic — Xử lý nghiệp vụ `consume` cho lab.
 * Code — `async consume()` — gọi dependency inject / client.
 * (EN Logic: Business handler `consume` for the lab.)
 * (EN Code: `async consume()` — uses injected deps / clients.)
 */
    async consume(userId: string, channel: string): Promise<RateLimitResult> {
        const key = `rate_limit:${userId}:${channel}`
        const current = await this.redis.incr(key)

        // Nếu đây là lần đầu ghi key, đặt TTL.
        // (EN: If this is the first write, set TTL.)
        if (current === 1) {
            await this.redis.expire(key, this.windowSeconds)
        }

        if (current > this.max) {
            const ttl = await this.redis.ttl(key)
            this.logger.warn(
                `Rate limit exceeded for ${userId}:${channel} — ${current}/${this.max}`,
            )
            return {
                allowed: false,
                remaining: 0,
                limit: this.max,
                retryAfterSeconds: ttl > 0 ? ttl : this.windowSeconds,
            }
        }

        return {
            allowed: true,
            remaining: this.max - current,
            limit: this.max,
            retryAfterSeconds: null,
        }
    }

    /**
 * Logic — Trả health + hostname để demo load balancer / nhiều replica.
 * Code — `os.hostname()` + object `{ status, servedBy, timestamp }`.
 * (EN Logic: Return health and hostname for load-balancer demos.)
 * (EN Code: `os.hostname()` plus `{ status, servedBy, timestamp }`.)
 */
    async getStatus(userId: string, channel: string): Promise<{
        used: number
        remaining: number
        limit: number
        ttl: number
    }> {
        const key = `rate_limit:${userId}:${channel}`
        const used = Number(await this.redis.get(key)) || 0
        const ttl = await this.redis.ttl(key)
        return {
            used,
            remaining: Math.max(0, this.max - used),
            limit: this.max,
            ttl: ttl > 0 ? ttl : 0,
        }
    }
}
