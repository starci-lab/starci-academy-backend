import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when the BYOM agent cannot build a background-service definition for the host OS. */
export interface PlaygroundAgentUnsupportedPlatformExceptionMetadata extends AbstractExceptionMetadata {
    platform: string
}

/**
 * Thrown by {@link ServiceInstallerService} when `process.platform` is none of
 * `win32` / `linux` / `darwin` -- there is no known service manager to install
 * against.
 */
export class PlaygroundAgentUnsupportedPlatformException extends AbstractException {
    constructor(
        {
            platform,
            originalError,
        }: PlaygroundAgentUnsupportedPlatformExceptionMetadata,
    ) {
        super(
            "Unsupported platform for service install.",
            "PLAYGROUND_AGENT_UNSUPPORTED_PLATFORM_EXCEPTION",
            {
                platform,
                originalError,
            },
        )
    }
}
