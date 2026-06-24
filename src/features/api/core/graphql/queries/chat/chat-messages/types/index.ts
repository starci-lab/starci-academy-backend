/** Decoded chat messages cursor (opaque base64url payload). */
export interface DecodedChatCursor {
    /** Rows to skip on the next page (offset pagination, newest-first). */
    offset: number
}
