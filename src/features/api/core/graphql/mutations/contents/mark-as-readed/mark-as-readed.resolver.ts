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
import type {
    Request,
} from "express"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    MarkAsReadedRequest,
    MarkAsReadedResponse,
} from "./graphql-types"
import {
    MarkAsReadedService,
} from "./mark-as-readed.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
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
        [Locale.Vi]: "Cập nhật trạng thái đã đọc thành công",
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
            context: {
                req: Request & { enrollmentId?: string }
            },
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
