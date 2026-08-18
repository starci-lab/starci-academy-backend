import {
    Args,
    Context,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    MarkAsReadedRequest,
} from "./graphql-types/request"
import {
    MarkAsReadedResponse,
} from "./graphql-types/response"
import {
    MarkAsReadedService,
} from "./mark-as-readed.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import type {
    GraphQLEnrollmentContextParams,
} from "../../../shared/types/graphql-enrollment-context"
@Resolver()
/** GraphQL entry that authenticates before mutating read progress (and optionally claiming the one-time reward). */
export class MarkAsReadedResolver {
    constructor(
        private readonly markAsReadedService: MarkAsReadedService,
    ) { }

    /**
     * Marks a content as read or unread for the current user.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content read status updated successfully",
        [Locale.Vi]: "Cập nhật trạng thái đã đọc thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => MarkAsReadedResponse,
        {
            name: "markContentAsReaded",
            description: "Marks a content as read or unread for the current user.",
        },
    )
    async execute(
        @Args("request")
            request: MarkAsReadedRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Context()
            context: GraphQLEnrollmentContextParams,
    ): Promise<MarkAsReadedResponse> {
        return this.markAsReadedService.execute(
            {
                request,
                locale,
                user,
                // course-scoped progress is keyed by enrollment (set by GraphQLEnrollmentGuard)
                enrollmentId: context.req.enrollmentId,
            },
        )
    }
}
