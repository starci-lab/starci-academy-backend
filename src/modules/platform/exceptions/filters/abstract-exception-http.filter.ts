import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from "@nestjs/common"
import type {
    Response,
} from "express"
import {
    AbstractException,
} from "../errors/abstract"

/**
 * Global REST exception filter for {@link AbstractException}. Nest's default
 * filter only maps subclasses of `HttpException` to their status code —
 * `AbstractException` extends plain `Error`, so without this filter every
 * thrown `AbstractException` falls through to a generic 500. This filter
 * reads the exception's optional `httpStatus` (set by exceptions that need
 * to preserve a specific status, e.g. guards) and defaults to 500 otherwise,
 * so most domain exceptions keep their existing (pre-migration) 500 behavior
 * exactly, while guard/auth exceptions can opt into 401/403/404/400.
 *
 * GraphQL requests are explicitly skipped — Apollo's own error pipeline
 * (`formatError` in {@link MonolithicApolloServerModule}) handles those;
 * calling `response.status().json()` on a GraphQL request's underlying
 * response would double-send and crash the request.
 */
@Catch(AbstractException)
export class AbstractExceptionHttpFilter implements ExceptionFilter {
    private readonly logger = new Logger(AbstractExceptionHttpFilter.name)

    catch(exception: AbstractException, host: ArgumentsHost): void {
        // GraphQL operations ride on the same HTTP req/res under the hood, but
        // must be left to Apollo's own formatError — do not touch the response here
        if (host.getType<string>() === "graphql") {
            throw exception
        }
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const status = exception.httpStatus ?? HttpStatus.INTERNAL_SERVER_ERROR
        this.logger.error(exception.message,
            exception.stack)
        response.status(status).json({
            statusCode: status,
            code: exception.code,
            message: exception.message,
        })
    }
}
