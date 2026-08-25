import {
    UseGuards, UseInterceptors 
} from "@nestjs/common"
import {
    Args, Mutation, Resolver 
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
    ResetLearnAiCompanionRequest,
    ResolveLearnAiCompanionRequest,
} from "./graphql-types/request"
import {
    ResetLearnAiCompanionResponse,
    ResolveLearnAiCompanionResponse,
} from "./graphql-types/response"
import type {
    ResetLearnAiCompanionData,
    ResolveLearnAiCompanionData,
} from "./graphql-types/response"

@Resolver()
/** Authenticated lifecycle API for the single active companion of an enrolled course. */
export class LearnAiCompanionMutationResolver {
    constructor(private readonly contentAiService: ContentAiService) {}

  @UseThrottler(ThrottlerConfig.Soft)
  @GraphQLSuccessMessage({
      [Locale.En]: "Learn companion resolved successfully",
      [Locale.Vi]: "Đã mở trợ lý học tập", // vn-ok: vi-locale string emitted to clients
  })
  @UseGuards(KeycloakAuthGraphQLGuard)
  @UseInterceptors(GraphQLTransformInterceptor)
  @Mutation(() => ResolveLearnAiCompanionResponse,
      {
          name: "resolveLearnAiCompanion",
          description:
      "Resolve the learner's one active, course-scoped Learn companion.",
      })
    async resolve(
    @Args("request")
        request: ResolveLearnAiCompanionRequest,
    @KeycloakGraphQLUser()
        user: UserEntity,
    ): Promise<ResolveLearnAiCompanionData> {
        const session = await this.contentAiService.resolveLearnAiCompanion({
            userId: user.id,
            courseId: request.courseId,
        })
        return {
            sessionId: session?.id ?? null,
        }
    }

  @UseThrottler(ThrottlerConfig.Soft)
  @GraphQLSuccessMessage({
      [Locale.En]: "Learn companion reset successfully",
      [Locale.Vi]: "Đã đặt lại trợ lý học tập", // vn-ok: vi-locale string emitted to clients
  })
  @UseGuards(KeycloakAuthGraphQLGuard)
  @UseInterceptors(GraphQLTransformInterceptor)
  @Mutation(() => ResetLearnAiCompanionResponse,
      {
          name: "resetLearnAiCompanion",
          description:
      "Archive the current course companion so the next resolve starts fresh.",
      })
  async reset(
    @Args("request")
        request: ResetLearnAiCompanionRequest,
    @KeycloakGraphQLUser()
        user: UserEntity,
  ): Promise<ResetLearnAiCompanionData> {
      return this.contentAiService.resetLearnAiCompanion({
          userId: user.id,
          courseId: request.courseId,
      })
  }
}
