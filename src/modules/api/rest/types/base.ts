/**
 * Interface for typed API response without decorators (e.g. in services).
 */
export interface IAbstractRestResult<T = undefined> {
    success: boolean
    message: string
    data?: T
    error?: string
}
