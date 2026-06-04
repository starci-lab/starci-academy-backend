/**
 * Item row and backend API response types.
 */
export interface ItemRow {
    /**
     * Item ID.
     */
    id: number
    /**
     * Item name.
     */
    name: string
}

/**
 * Item list response (cache-aside).
 */
export interface GetItemsResponse {
    data: ReadonlyArray<ItemRow>
    source: "database" | "cache"
    podName: string
}

/**
 * Create item response.
 */
export interface CreateItemResponse {
    success?: boolean
    error?: string
}

/**
 * Health check response.
 */
export interface HealthResponse {
    mysql: "connected" | "disconnected"
    redis: "connected" | "disconnected"
    podName: string
}
