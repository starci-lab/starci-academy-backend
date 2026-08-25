import {
    UseGuards, UseInterceptors 
} from "@nestjs/common"
import {
    Args, Query, Resolver 
} from "@nestjs/graphql"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ContentAiService 
} from "@modules/bussiness/content-ai/content-ai.service"
import {
    UserEntity 
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale 
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard 
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser 
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig 
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler 
} from "@modules/platform/throttler/throttler.decorators"
import {
    LearnAiCompanionRequest 
} from "./graphql-types/request"
import {
    LearnAiCompanionResponse 
} from "./graphql-types/response"
import type {
    LearnAiCompanionData 
} from "./graphql-types/response"

@Resolver()
/** Authenticated read API for continuity across every page inside one course Learn shell. */
export class LearnAiCompanionQueryResolver {
    constructor(private readonly contentAiService: ContentAiService) {}

  @UseThrottler(ThrottlerConfig.Soft)
  @GraphQLSuccessMessage({
      [Locale.En]: "Learn companion loaded successfully",
      [Locale.Vi]: "Đã tải trợ lý học tập", // vn-ok: vi-locale string emitted to clients
  })
  @UseGuards(KeycloakAuthGraphQLGuard)
  @UseInterceptors(GraphQLTransformInterceptor)
  @Query(() => LearnAiCompanionResponse,
      {
          name: "learnAiCompanion",
          description:
      "Load the active course-scoped Learn companion and its durable continuity.",
      })
    async execute(
    @Args("request")
        request: LearnAiCompanionRequest,
    @KeycloakGraphQLUser()
        user: UserEntity,
    ): Promise<LearnAiCompanionData> {
        return this.contentAiService.loadLearnAiCompanion({
            userId: user.id,
            courseId: request.courseId,
            limit: request.limit,
            offset: request.offset,
        })
    }
}
