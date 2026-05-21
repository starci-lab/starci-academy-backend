/**
 * Response GET / health probe.
 * (EN: GET / health probe response.)
 */
export interface HealthResponse {
    status: string
    message: string
    endpoints: Record<string, string>
}
