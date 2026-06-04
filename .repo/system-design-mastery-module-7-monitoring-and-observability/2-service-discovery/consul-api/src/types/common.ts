/**
 * Shared lesson types (responses, params).
 */
export interface ApiMessageResponse {
    /**
     * Processing status.
     */
    status: string
    /**
     * Human-readable result message.
     */
    message?: string
}
