import {
    SUCCESS_MESSAGE_METADATA
} from "../constants"
import type {
    WsSuccessMessageValue,
} from "../decorators/success"
import {
    InjectSuperJson 
} from "@modules/mixin"
import {
    TypedSocket 
} from "@modules/socketio"
import {
    Locale,
} from "@modules/databases"
import {
    Injectable, 
    NestInterceptor, 
    ExecutionContext, 
    CallHandler 
} from "@nestjs/common"
import {
    Reflector 
} from "@nestjs/core"
import {
    Observable, map, catchError 
} from "rxjs"
import SuperJSON from "superjson"
import {
    MESSAGE_METADATA 
} from "@nestjs/websockets/constants"

@Injectable()
/**
 * Wraps gateway handler results as `{success, message, data}` (and errors the same way) so
 * clients share one envelope.
 */
export class WsTransformInterceptor<T = unknown>
implements NestInterceptor<T, void>
{
    constructor(
    private readonly reflector: Reflector,
    @InjectSuperJson()
    private readonly superJson: SuperJSON,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<void> {
        const client = context.switchToWs().getClient<TypedSocket>()
 
        const messageValue =
      this.reflector.get<WsSuccessMessageValue>(
          SUCCESS_MESSAGE_METADATA,
          context.getHandler()) ??
      this.reflector.get<WsSuccessMessageValue>(
          SUCCESS_MESSAGE_METADATA,
          context.getClass())

        const resolvedMessage = this.resolveMessage(
            messageValue,
            client,
        )
        const eventName = this.reflector.get<string>(
            MESSAGE_METADATA,
            context.getHandler())
        return next.handle().pipe(
            map((data) => {
                client.emit(
                    eventName,
                    {
                        success: true,
                        message: resolvedMessage,
                        data: this.superJson.serialize(data),
                    },
                    
                )
            }),
            catchError((err) => {
                return new Observable<void>((observer) => {
                    client.emit(
                        eventName,
                        {
                            success: false,
                            message: err.message,
                            error: err.name,
                        },
                    )
                    observer.complete()
                })
            }),
        )
    }

    private resolveMessage(
        value: WsSuccessMessageValue | undefined,
        client: TypedSocket,
    ): string | undefined {
        if (!value) return undefined
        if (typeof value === "string") return value

        // resolve locale from socket data first, then accept-language header
        const dataLocale = (client.data as { locale?: string } | undefined)?.locale
        const locale = (
            (dataLocale === Locale.Vi || dataLocale === Locale.En
                ? dataLocale
                : undefined) ??
      this.resolveAcceptLanguage(client) ??
      Locale.En
        ) as Locale

        return value[locale] ?? value[Locale.En] ?? value[Locale.Vi]
    }

    private resolveAcceptLanguage(client: TypedSocket): Locale | undefined {
        const raw = (client.handshake?.headers as Record<string, unknown> | undefined)?.["accept-language"]
        if (typeof raw !== "string") return undefined

        const parts = raw.split(",").map((p) => p.trim().toLowerCase())
        for (const part of parts) {
            const lang = part.split(";")[0]
            if (lang.startsWith("vi")) return Locale.Vi
            if (lang.startsWith("en")) return Locale.En
        }
        return undefined
    }
}
