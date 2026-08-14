import {
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
    CodingDomainSummaryResponse,
    CodingDomainSummaryResponseData,
} from "./graphql-types/response"
import {
    CodingDomainSummaryService,
} from "./coding-domain-summary.service"

@Resolver()
/**
 * GraphQL entry for `codingDomainSummary`: how many enabled problems each
 * interview topic domain holds.
 *
 * There is no `@Args` and no `@GraphQLLocale()`: the operation takes no request, and the counts are
 * a fact about the catalog rather than about which translations exist, so the handler always reads
 * the English index.
 */
export class CodingDomainSummaryResolver {
    constructor(
        private readonly codingDomainSummaryService: CodingDomainSummaryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding domain summary fetched successfully",
        [Locale.Vi]: "Lấy tổng số bài theo chủ đề thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CodingDomainSummaryResponse,
        {
            name: "codingDomainSummary",
            description: "Counts enabled coding problems per interview topic domain. A domain with no enabled problems is absent rather than zero.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CodingDomainSummaryResponseData> {
        return this.codingDomainSummaryService.execute(
            {
                request: undefined,
                user,
            },
        )
    }
}
