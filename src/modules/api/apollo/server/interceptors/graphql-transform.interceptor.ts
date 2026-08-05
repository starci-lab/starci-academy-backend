import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    SetMetadata,
} from "@nestjs/common"
import {
    Reflector,
} from "@nestjs/core"
import {
    Observable,
} from "rxjs"
import {
    map,
    catchError,
} from "rxjs/operators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    resolveLocale,
} from "@modules/platform/locale/resolve-locale"
import {
    GraphQLResponse,
} from "../types/graphql-response"

const SUCCESS_MESSAGE_METADATA = "graphqlSuccessMessage"

/** Success message can be localized by passing a Record<Locale, string>. */
export type GraphQLSuccessMessage = Record<Locale, string>

/** Sets the success message for the next resolver/handler. */
export const GraphQLSuccessMessage = (message: GraphQLSuccessMessage) =>
    SetMetadata(SUCCESS_MESSAGE_METADATA,
        message)

@Injectable()
/**
 * Interceptor that wraps resolver result in { data, message, success } and handles errors.
 *
 * @example
 * Use @GraphQLSuccessMessage("Done") on a resolver; this interceptor adds it to the response.
 */
export class GraphQLTransformInterceptor<T = unknown>
implements NestInterceptor<T, GraphQLResponse<T>> {
    constructor(private readonly reflector: Reflector) {}

    /**
 * Intercept the request and transform the response.
 * @param context - The execution context.
 * @param next - The next handler.
 * @returns The transformed response.
 */
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<GraphQLResponse<T>> {
        // get custom message from metadata (resolver or class)
        const messageMeta =
        this.reflector.get<GraphQLSuccessMessage>(
            SUCCESS_MESSAGE_METADATA,
            context.getHandler(),
        ) ??
        this.reflector.get<GraphQLSuccessMessage>(
            SUCCESS_MESSAGE_METADATA,
            context.getClass(),
        )

        const locale = resolveLocale(context)

        const message =
        messageMeta?.[locale] ??
        messageMeta?.[Locale.En] ??
        "Success"

        return next.handle().pipe(
            map((data): GraphQLResponse<T> => ({
                data,
                message,
                success: true,
            })),
            catchError((err) => {
                return new Observable<GraphQLResponse<T>>(  
                    (observer) => {
                        observer.next({
                            success: false,
                            message: err?.message ?? "Internal server error",
                            error: err?.name ?? "Error",
                        })
                        observer.complete()
                    }
                )
            }),
        )
    }
}
