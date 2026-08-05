import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown from a migration's `down()` when the migration has no reverse path. */
export interface IrreversibleMigrationExceptionMetadata extends AbstractExceptionMetadata {
    /** Name of the migration class that cannot be reversed. */
    migrationName: string
    /** Why rolling back is impossible or unsafe (e.g. the feature/data is gone). */
    reason: string
}

/**
 * Thrown by a TypeORM migration's `down()` method when the feature it dropped
 * has been removed from the codebase, so there is nothing to recreate the
 * tables from and re-running the migration forward would in any case lose
 * data. Always thrown -- never a conditional path.
 */
export class IrreversibleMigrationException extends AbstractException {
    constructor(
        {
            migrationName,
            reason,
            originalError,
        }: IrreversibleMigrationExceptionMetadata,
    ) {
        super(
            `${migrationName} is not reversible: ${reason}`,
            "IRREVERSIBLE_MIGRATION_EXCEPTION",
            {
                migrationName,
                reason,
                originalError,
            },
        )
    }
}
