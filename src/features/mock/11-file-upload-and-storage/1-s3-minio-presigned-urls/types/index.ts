/** Response of `POST /presign/put` — a short-lived signed PUT URL. */
export interface PresignPutResponse {
    /** Server-generated object key. */
    key: string
    /** Absolute URL the client PUTs the bytes to. */
    url: string
    /** HTTP method the URL is signed for. */
    method: "PUT"
    /** Lifetime of the signed URL in seconds (cosmetic for the mock). */
    expiresInSeconds: number
    /** Original filename (echoed). */
    filename: string
}

/** Response of `GET /presign/get/:key` — a short-lived signed GET URL. */
export interface PresignGetResponse {
    /** Absolute URL the client reads the bytes from. */
    url: string
    /** Object key (echoed). */
    key: string
    /** Lifetime of the signed URL in seconds (cosmetic for the mock). */
    expiresInSeconds: number
}
