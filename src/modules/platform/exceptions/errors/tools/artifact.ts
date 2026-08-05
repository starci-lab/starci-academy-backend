import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when an artifact id does not match any row in the tools store registry. */
export interface ToolsArtifactNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    artifactId: string
}

/**
 * Thrown by the `apps/tools` ops console (artifacts, sync) when an artifact id
 * does not match any row in {@link ToolsStoreService}'s registry.
 */
export class ToolsArtifactNotFoundException extends AbstractException {
    constructor(
        {
            artifactId,
            originalError,
        }: ToolsArtifactNotFoundExceptionMetadata,
    ) {
        super(
            "Artifact not found.",
            "TOOLS_ARTIFACT_NOT_FOUND_EXCEPTION",
            {
                artifactId,
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}

/** Thrown when a (re-)sync is requested for an artifact with no targets/keyPrefix to sync to. */
export interface ToolsArtifactSyncTargetsMissingExceptionMetadata extends AbstractExceptionMetadata {
    artifactId: string
}

/**
 * Thrown by `SyncService.syncArtifact` when the artifact was registered
 * without a target/key prefix, so there is nothing to push to.
 */
export class ToolsArtifactSyncTargetsMissingException extends AbstractException {
    constructor(
        {
            artifactId,
            originalError,
        }: ToolsArtifactSyncTargetsMissingExceptionMetadata,
    ) {
        super(
            "Artifact has no targets/keyPrefix; nothing to sync to.",
            "TOOLS_ARTIFACT_SYNC_TARGETS_MISSING_EXCEPTION",
            {
                artifactId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
