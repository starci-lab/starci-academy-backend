
import {
    Injectable,
} from "@nestjs/common"
import {
    InjectConsoleWinston,
    InjectLokiWinston,
    InjectWinstonAndConsole,
} from "./winston.decorators"
import {
    configMap,
} from "./config"
import {
    WinstonLog,
} from "./enums/winston-log"
import {
    WinstonLevel,
} from "./types/level"
import {
    GetLoggerParams,
} from "./types/params"
import {
    Logger,
} from "winston"
import _ from "lodash"

@Injectable()
/**
 * The service for the Winston.
 */
export class WinstonService {
    constructor(
        @InjectConsoleWinston()
        private readonly consoleLogger: Logger,
        @InjectLokiWinston()
        private readonly lokiLogger: Logger,
        @InjectWinstonAndConsole()
        private readonly winstonAndConsoleLogger: Logger,
    ) {}

    /**
     * Log a message.
     * Chooses logger from config: console only, loki only, or both (winston + console).
     *
     * @param name - The name of the log.
     * @param message - The message to log.
     */
    public log<TName extends WinstonLog>(
        name: TName,
        message: (typeof configMap)[TName]["messageType"],
    ): void {
        const _message = _.omitBy(message,
            _.isUndefined)
        const config = configMap[name]
        const logger = this.getLogger(config)
        if (!logger) {
            return
        }
        switch (config.level) {
        case WinstonLevel.Error: {
            logger.error(config.name,
                _message)
            break
        }
        case WinstonLevel.Verbose: {
            logger.verbose(config.name,
                _message)
            break
        }
        case WinstonLevel.Debug: {
            logger.debug(config.name,
                _message)
            break
        }
        case WinstonLevel.Fatal: {
            logger.error(config.name,
                _message)
            break
        }
        case WinstonLevel.Warn: {
            logger.warn(config.name,
                _message)
            break
        }
        default: {
            logger.info(config.name,
                _message)
            break
        }
        }
    }

    /**
     * Resolve which logger to use from config.console and config.loki.
     * @param config - The config to use.
     * @returns The logger to use.
     */
    private getLogger({ console, loki }: GetLoggerParams): Logger | null {
        // Determine which transports to use.
        const useConsole = console !== false
        const useLoki = loki === true
        // If both transports are used, return the logger with both transports.
        if (useConsole && useLoki) {
            return this.winstonAndConsoleLogger
        }
        // If only the console transport is used, return the logger with the console transport.
        if (useConsole) {
            return this.consoleLogger
        }
        // If only the Loki transport is used, return the logger with the Loki transport.
        if (useLoki) {
            return this.lokiLogger
        }
        // If no transports are used, return null.
        return null
    }
}
