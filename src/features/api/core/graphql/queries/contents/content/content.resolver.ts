import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    ContentEntity,
    Locale,
} from "@modules/databases"
import {
    ContentRequest,
    ContentResponse,
} from "./graphql-types"
import {
    ContentQueryService,
} from "./content.service"
import {
    KeycloakAuthGraphQLGuard
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard
} from "@modules/bussiness"

@Resolver(() => ContentEntity)
export class ContentResolver {
    constructor(
        private readonly contentQueryService: ContentQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content fetched successfully",
        [Locale.Vi]: "Lấy nội dung thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentResponse,
        {
            name: "content",
            description: "Returns a single module content row by primary id.",
        },
    )
    async execute(
        @Args("request")
            request: ContentRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ContentEntity> {
        return this.contentQueryService.execute(
            {
                request,
                locale,
            },
        )
    }
}
