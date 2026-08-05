import {
    AbstractException,
} from "@modules/platform/exceptions/errors/abstract"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
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
