import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
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
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FoundationService,
} from "./foundation.service"
import {
    FoundationRequest,
} from "./graphql-types/request"
import {
    FoundationResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public GraphQL entry for `foundation` -- one catalog item by id or display id.
 */
export class FoundationResolver {
    constructor(
        private readonly foundationService: FoundationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Foundation fetched successfully",
        [Locale.Vi]: "Lấy tài nguyên nền tảng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => FoundationResponse,
        {
            name: "foundation",
            description: "Returns a single foundation item by id or displayId.",
        },
    )
    async execute(
        @Args("request") request: FoundationRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<FoundationEntity> {
        return this.foundationService.execute({
            request,
            locale,
        })
    }
}
