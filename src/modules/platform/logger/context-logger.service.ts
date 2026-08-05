import {
    ConsoleLogger 
} from "@nestjs/common"

/**
 * Nest ConsoleLogger that swallows ClientProxy chatter and debug/fatal so boot logs stay
 * readable.
 */
export class ContextLoggerService extends ConsoleLogger {
    log(...params: Parameters<ConsoleLogger["log"]>) {
        if (params[1] === "ClientProxy") return
        super.log(...params)
    }
    debug() {
        return false
    }
    fatal() {
        return false
    }  
}
