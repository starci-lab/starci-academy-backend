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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
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
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CoursePriceQuotesRequest,
} from "./graphql-types/request"
import {
    CoursePriceQuotesData,
    CoursePriceQuotesResponse,
} from "./graphql-types/response"
import {
    CoursePriceQuotesService,
} from "./course-price-quotes.service"

@Resolver()
/** Authenticated array course-price quote door. */
export class CoursePriceQuotesResolver {
    constructor(private readonly service: CoursePriceQuotesService) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course prices quoted successfully",
        [Locale.Vi]: "Báo giá khóa học thành công", // vn-ok: localized GraphQL success message
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => CoursePriceQuotesResponse,
        {
            name: "coursePriceQuotes" 
        })
    async execute(
        @KeycloakGraphQLUser() user: UserEntity,
        @Args("request") request: CoursePriceQuotesRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<CoursePriceQuotesData> {
        return this.service.execute({
            request, user, locale 
        })
    }
}
