import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
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
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
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
        GraphQLMustEnrolledGuard,
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
    ): Promise<MarkAsReadedResponse> {
        return this.markAsReadedService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
