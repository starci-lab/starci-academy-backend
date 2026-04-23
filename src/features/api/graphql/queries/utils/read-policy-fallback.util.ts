import {
    sleep,
} from "@modules/common"
import {
    envConfig,
} from "@modules/env"

interface ReadPolicySource {
    priority: number
    type: "elasticsearch"
    maxRetries: number
    enabled: boolean
    retryDelayMs: number
    timeoutMs: {
        min: number
        max: number
    }
}

type ReadPolicySourceType = ReadPolicySource["type"]

interface ExecuteElasticScyllaFallbackParams<T> {
    elasticsearch: () => Promise<T>
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    let timeoutId: NodeJS.Timeout | undefined

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Read source timed out after ${timeoutMs}ms`))
        },
        timeoutMs)
    })

    try {
        return await Promise.race([
            promise,
            timeoutPromise,
        ])
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
    }
}

const executeWithPolicy = async <T>(
    source: ReadPolicySource,
    executor: () => Promise<T>,
): Promise<T> => {
    const retries = Math.max(0,
        source.maxRetries)
    let lastError: unknown

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await withTimeout(
                executor(),
                source.timeoutMs.max,
            )
        } catch (error) {
            lastError = error
            if (attempt < retries) {
                await sleep(source.retryDelayMs)
            }
        }
    }

    throw lastError ?? new Error(`Read source ${source.type} failed`)
}

const getElasticScyllaReadSources = (): Array<ReadPolicySource> => {
    const sourceTypes = new Set<ReadPolicySourceType>([
        "elasticsearch",
    ])

    return envConfig().readPolicy.sources
        .filter((source): source is ReadPolicySource =>
            source.enabled && sourceTypes.has(source.type as ReadPolicySourceType),
        )
        .sort((a,
            b) => a.priority - b.priority)
}

export const executeElasticScyllaFallback = async <T>(
    params: ExecuteElasticScyllaFallbackParams<T>,
): Promise<T> => {
    const sources = getElasticScyllaReadSources()
    if (!sources.length) {
        throw new Error("No enabled read sources for elasticsearch/scylladb fallback")
    }

    let lastError: unknown
    for (const source of sources) {
        try {
            return await executeWithPolicy(source,
                params.elasticsearch)
        } catch (error) {
            lastError = error
        }
    }

    throw lastError ?? new Error("All read sources failed")
}