import {
    PayloadTooLargeException,
} from "@nestjs/common"
import type {
    IncomingMessage,
} from "http"

/**
 * Reads an inbound request body into a single Buffer.
 *
 * The binary upload endpoints (chunk PATCH, tus PATCH, presigned PUT) send
 * raw bytes with a non-JSON content-type, so Nest's default body parsers skip
 * them and leave the stream intact for us to consume here. Aborts early with
 * a 413 once `maxBytes` is exceeded so a runaway upload cannot exhaust memory.
 *
 * @param request - The underlying Node/Express request (a readable stream).
 * @param maxBytes - Hard cap on the number of bytes to accept.
 * @returns The full request body as a Buffer.
 */
export const readRawBody = (
    request: IncomingMessage,
    maxBytes: number,
): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Array<Buffer> = []
        let received = 0

        request.on("data",
            (chunk: Buffer) => {
                received += chunk.length

                // reject the moment the running total crosses the cap
                if (received > maxBytes) {
                    request.destroy()
                    reject(new PayloadTooLargeException(`Body exceeds ${maxBytes} bytes`))
                    return
                }

                chunks.push(chunk)
            })

        // resolve with the assembled buffer once the stream ends
        request.on("end",
            () => {
                resolve(Buffer.concat(chunks))
            })

        // surface any low-level stream error to the caller
        request.on("error",
            (error) => {
                reject(error)
            })
    })
}
