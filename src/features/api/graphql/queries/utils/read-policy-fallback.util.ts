import {
    sleep,
} from "@modules/common"
import {
    ScyllaDBService,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"

interface ReadPolicySource {
    priority: number
    type: "elasticsearch" | "scylladb"
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
    scylladb: () => Promise<T>
}

interface SearchScyllaLocalizedDocumentsParams<T extends object> {
    scylladb: ScyllaDBService
    tableName: string
    locale: string
    limit: number
    pageNumber: number
    sorts: Array<{
        by: string
        order: string
    }>
    search?: string
    searchFields?: Array<string>
    exactFilters?: Record<string, unknown>
    postFilter?: (row: T) => boolean
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
        "scylladb",
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
            if (source.type === "elasticsearch") {
                return await executeWithPolicy(source,
                    params.elasticsearch)
            }
            return await executeWithPolicy(source,
                params.scylladb)
        } catch (error) {
            lastError = error
        }
    }

    throw lastError ?? new Error("All read sources failed")
}

const comparePrimitiveValues = (left: unknown, right: unknown): number => {
    if (left === right) {
        return 0
    }

    if (left == null) {
        return 1
    }

    if (right == null) {
        return -1
    }

    if (typeof left === "number" && typeof right === "number") {
        return left - right
    }

    return String(left).localeCompare(String(right))
}

const applySorts = <T extends object>(
    rows: Array<T>,
    sorts: SearchScyllaLocalizedDocumentsParams<T>["sorts"],
): Array<T> => {
    return rows.sort((left,
        right) => {
        const leftRecord = left as Record<string, unknown>
        const rightRecord = right as Record<string, unknown>

        for (const sort of sorts) {
            const by = sort.by
            const order = sort.order.toLowerCase() === "desc" ? "desc" : "asc"
            const comparison = comparePrimitiveValues(leftRecord[by],
                rightRecord[by])

            if (comparison !== 0) {
                return order === "desc" ? -comparison : comparison
            }
        }
        return 0
    })
}

export const searchScyllaLocalizedDocuments = async <T extends object>(
    params: SearchScyllaLocalizedDocumentsParams<T>,
): Promise<{
    data: Array<T>
    count: number
}> => {
    const {
        scylladb,
        tableName,
        locale,
        limit,
        pageNumber,
        sorts,
        search,
        searchFields = [],
        exactFilters = {
        },
        postFilter,
    } = params

    const sourceRows = await scylladb.findLocalizedDocuments<T>(tableName,
        locale)

    const exactFilteredRows = sourceRows.filter((row) => {
        const rowRecord = row as Record<string, unknown>
        return Object.entries(exactFilters).every(([key,
            value]) => {
            if (value === undefined) {
                return true
            }
            return rowRecord[key] === value
        })
    })

    const searchTerm = search?.trim().toLowerCase()
    const searchFilteredRows = !searchTerm
        ? exactFilteredRows
        : exactFilteredRows.filter((row) => {
            const rowRecord = row as Record<string, unknown>
            return searchFields.some((field) => {
                const value = rowRecord[field]
                if (value == null) {
                    return false
                }
                return String(value).toLowerCase().includes(searchTerm)
            })
        })

    const finalFilteredRows = postFilter
        ? searchFilteredRows.filter(postFilter)
        : searchFilteredRows

    const sortedRows = applySorts(finalFilteredRows,
        sorts)
    const count = sortedRows.length
    const from = Math.max(0,
        pageNumber * limit)
    const to = from + Math.max(0,
        limit)

    return {
        count,
        data: sortedRows.slice(from,
            to),
    }
}