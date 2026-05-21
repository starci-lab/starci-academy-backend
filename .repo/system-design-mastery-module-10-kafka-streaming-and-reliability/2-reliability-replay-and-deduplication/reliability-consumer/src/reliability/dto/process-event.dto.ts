/**
 * DTO request — validation `class-validator` cho API demo.
 * (EN: Request DTO — `class-validator` rules for demo API.)
 */
export interface ProcessEventPayload {
    clientMessageId: string
    type: string
    payload?: Record<string, string | number | boolean>
    simulateFailure?: boolean
}
