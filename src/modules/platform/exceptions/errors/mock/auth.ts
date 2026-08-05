import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown by the socket.io-jwt lesson mock's login endpoint on a credential mismatch. */
export type MockInvalidCredentialsExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by lesson `8-websocket-realtime-communication/1-socketio-security-jwt`
 * when the supplied username/password do not match the in-memory store.
 */
export class MockInvalidCredentialsException extends AbstractException {
    constructor({
        originalError,
    }: MockInvalidCredentialsExceptionMetadata) {
        super(
            "Invalid credentials.",
            "MOCK_INVALID_CREDENTIALS_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
