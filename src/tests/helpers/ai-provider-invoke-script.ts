import {
    AIMessage,
} from "@langchain/core/messages"
import type {
    Provider,
} from "@nestjs/common"
import KeyvRedis, {
    Keyv,
} from "@keyv/redis"
import {
    CacheableMemory,
} from "cacheable"
import {
    createCache,
} from "cache-manager"
import Redis from "ioredis"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"

/** DI tokens owned by CacheService; repeated here only to compose its real E2E providers. */
export const aiE2eRedisCacheManagerToken = "REDIS_CACHE_MANAGER"
const aiE2eMemoryCacheManagerToken = "MEMORY_CACHE_MANAGER"

/** Deterministic result emitted by the external LangChain-client seam in AI E2E. */
export interface AiProviderInvokeSuccess {
    text: string
    promptTokens?: number
    completionTokens?: number
    cachedTokens?: number
}

/** One provider attempt is either a realistic AI message or the provider error it throws. */
export type AiProviderInvokeOutcome = AiProviderInvokeSuccess | Error

/**
 * FIFO provider script for transport-level AI fallback tests.
 *
 * Production owns everything above this seam: GraphQL, CQRS, entitlement,
 * catalog selection, mounted key loading, Redis health and key rotation. The
 * only nondeterministic/out-of-process operation is the concrete LangChain
 * client's network result, so the E2E replaces exactly that operation.
 */
export class AiProviderInvokeScript {
    private outcomes: Array<AiProviderInvokeOutcome> = []

    set(outcomes: Array<AiProviderInvokeOutcome>): void {
        this.outcomes = [...outcomes]
    }

    async next(): Promise<AIMessage> {
        const outcome = this.outcomes.shift()
        if (!outcome) {
            throw new Error("AI provider E2E script exhausted")
        }
        if (outcome instanceof Error) {
            throw outcome
        }
        return new AIMessage({
            content: outcome.text,
            usage_metadata: {
                input_tokens: outcome.promptTokens ?? 0,
                output_tokens: outcome.completionTokens ?? 0,
                total_tokens: (outcome.promptTokens ?? 0)
                    + (outcome.completionTokens ?? 0),
                input_token_details: {
                    cache_read: outcome.cachedTokens ?? 0,
                },
            },
        })
    }
}

/**
 * Focused real-Redis providers for the AI E2E graph.
 *
 * The shared E2E stack publishes its Redis endpoint under the BullMQ variables.
 * Production's cache modules normally read a distinct cache endpoint, which is
 * intentionally absent in the shared stack. These providers bind both cache
 * adapters directly to that real shared Redis without mocking cache behavior.
 */
export const createAiE2eRedisProviders = (): Array<Provider> => {
    const host = process.env.REDIS_BULLMQ_HOST ?? "localhost"
    const port = Number(process.env.REDIS_BULLMQ_PORT ?? 6379)
    const password = process.env.REDIS_BULLMQ_PASSWORD
    const credentials = password
        ? `:${encodeURIComponent(password)}@`
        : ""
    const url = `redis://${credentials}${host}:${port}`
    return [
        {
            provide: aiE2eRedisCacheManagerToken,
            useFactory: () => createCache({
                stores: [
                    new Keyv({
                        store: new KeyvRedis(url,
                            {
                                throwOnConnectError: true,
                                throwOnErrors: true,
                            }),
                    }),
                ],
                ttl: 0,
            }),
        },
        {
            provide: aiE2eMemoryCacheManagerToken,
            useFactory: () => createCache({
                stores: [
                    new Keyv({
                        store: new CacheableMemory({
                            ttl: 0,
                        }),
                    }),
                ],
                ttl: 0,
            }),
        },
        {
            provide: createIoRedisKey(IoRedisInstanceKey.Cache),
            useFactory: () => new Redis({
                host,
                port,
                password: process.env.REDIS_BULLMQ_PASSWORD,
            }),
        },
    ]
}
