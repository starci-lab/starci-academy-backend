import {
    createParamDecorator,
    ExecutionContext,
} from "@nestjs/common"
import {
    resolveLocale,
} from "@modules/locale"

/**
 * Inject the locale from the request.
 */
export const GraphQLLocale = createParamDecorator(
    (_: unknown, context: ExecutionContext) => {
        return resolveLocale(context)
    }
)