import {
    Context,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import type {
    Request,
    Response,
} from "express"
import {
    MySessionsResponse,
    MySessionsResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Authenticated `mySessions` query for the logged-in-devices screen. Reads
 * the request's session cookie so the result can flag `current` on this
 * device; revoke itself is a separate mutation.
 */
export class MySessionsResolver {
    constructor(
        private readonly sessionService: SessionService,
        private readonly cookieService: CookieService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Active sessions fetched successfully",
        [Locale.Vi]: "Lấy danh sách thiết bị đăng nhập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MySessionsResponse,
        {
            name: "mySessions",
            description: "Returns the current user's active login sessions (devices), flagging the requesting device.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Context()
            ctx: {
                req: Request,
                res: Response,
            },
    ): Promise<MySessionsResponseData> {
        // read the requesting device's session id so the result can flag "this device"
        const currentSessionId = this.cookieService.getCookie(
            ctx.req,
            CookieName.SessionId,
        )
        // list active sessions scoped to the authenticated owner only
        const sessions = await this.sessionService.listSessions({
            keycloakId: user.keycloakId,
            currentSessionId,
        })
        return {
            data: sessions,
        }
    }
}
