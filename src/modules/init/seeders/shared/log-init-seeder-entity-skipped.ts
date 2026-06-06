import {
    AbstractException,
} from "@modules/exceptions"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ObjectLiteral 
} from "typeorm"

/**
 * Logs a warning when a single mount entity is skipped during init seed.
 */
export function logInitSeederEntitySkipped(
    winstonService: WinstonService,
    entityClass: ObjectLiteral,
    relativePath: string,
    error: unknown,
): void {
    winstonService.log(
        WinstonLog.InitSeederEntitySkipped,
        {
            entityType: entityClass.name,
            relativePath,
            errorCode: error instanceof AbstractException
                ? error.code
                : undefined,
            errorMessage: error instanceof Error
                ? error.message
                : String(error),
            errorStack: error instanceof Error
                ? error.stack
                : undefined,
        },
    )
}
