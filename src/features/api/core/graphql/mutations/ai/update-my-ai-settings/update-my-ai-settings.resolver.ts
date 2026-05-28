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
    GraphQLTransformInterceptor,
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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UpdateMyAiSettingsRequest,
    UpdateMyAiSettingsResponse,
} from "./graphql-types"
import {
    UpdateMyAiSettingsService,
} from "./update-my-ai-settings.service"

@Resolver()
export class UpdateMyAiSettingsResolver {
    constructor(
        private readonly updateMyAiSettingsService: UpdateMyAiSettingsService,
    ) { }

    /**
     * Updates the current user's AI lane settings (lane preference + BYOK key).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI settings updated successfully",
        [Locale.Vi]: "Cập nhật cài đặt AI thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UpdateMyAiSettingsResponse,
        {
            name: "updateMyAiSettings",
            description: "Updates the current user's AI lane settings.",
        },
    )
    async execute(
        @Args("request")
            request: UpdateMyAiSettingsRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.updateMyAiSettingsService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
