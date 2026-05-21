/**
 * Kiểu dữ liệu item và response API backend K8s.
 * (EN: Item row and backend API response types.)
 */
export interface ItemRow {
    /**
     * ID item.
     * (EN: Item ID.)
     */
    id: number
    /**
     * Tên item.
     * (EN: Item name.)
     */
    name: string
}

/**
 * Response danh sách item (cache-aside).
 * (EN: Item list response (cache-aside).)
 */
export interface GetItemsResponse {
    data: ReadonlyArray<ItemRow>
    source: "database" | "cache"
    podName: string
}

/**
 * Response tạo item.
 * (EN: Create item response.)
 */
export interface CreateItemResponse {
    success?: boolean
    error?: string
}

/**
 * Response health check.
 * (EN: Health check response.)
 */
export interface HealthResponse {
    mysql: "connected" | "disconnected"
    redis: "connected" | "disconnected"
    podName: string
}
