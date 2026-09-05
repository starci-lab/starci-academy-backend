import {
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    ConceptApiService,
} from "./concept-api.service"
import {
    ConceptRequest,
    ConceptsRequest,
} from "./graphql-types/request"
import {
    ConceptResponse,
    ConceptsResponse,
} from "./graphql-types/response"

@Resolver()
/** Public read-only GraphQL surface for the independent concept reader. */
export class ConceptsResolver {
    constructor(
        private readonly conceptApiService: ConceptApiService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Concepts fetched successfully",
        [Locale.Vi]: "Tải danh sách khái niệm thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => ConceptsResponse,
        {
            name: "concepts",
            description: "Returns the localized independent concept catalog.",
        })
    async list(
        @Args("request",
            {
                type: () => ConceptsRequest,
                nullable: true,
            })
            request: ConceptsRequest | undefined,
        @GraphQLLocale()
            locale: Locale,
    ) {
        return this.conceptApiService.list(request,
            locale)
    }

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Concept fetched successfully",
        [Locale.Vi]: "Tải khái niệm thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => ConceptResponse,
        {
            name: "concept",
            description: "Returns one localized concept by displayId, or null.",
        })
    async detail(
        @Args("request")
            request: ConceptRequest,
        @GraphQLLocale()
            locale: Locale,
    ) {
        return this.conceptApiService.detail(request,
            locale)
    }
}
