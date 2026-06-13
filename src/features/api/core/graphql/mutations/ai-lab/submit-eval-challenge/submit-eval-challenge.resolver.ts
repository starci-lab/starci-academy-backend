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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    SubmitEvalChallengeInput,
    SubmitEvalChallengeResponse,
} from "./graphql-types"
import {
    SubmitEvalChallengeService,
} from "./submit-eval-challenge.service"
import type {
    SubmitEvalChallengeResult,
} from "./types"

/**
 * GraphQL entry: submit a prompt template for grading against an AI Lab eval
 * set. Persists a Pending eval run and enqueues the async grading job, returning
 * the eval run id + job id. The FE subscribes to the job over the existing
 * job-notifications socket and polls `aiLabEvalResult` once it completes.
 */
@Resolver()
export class SubmitEvalChallengeResolver {
    constructor(
        private readonly submitEvalChallengeService: SubmitEvalChallengeService,
    ) { }

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "Eval submission queued for grading",
        [Locale.Vi]: "Đã xếp hàng chấm bài nộp eval",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitEvalChallengeResponse,
        {
            name: "submitEvalChallenge",
            description: "Submit a prompt template for grading against an AI Lab eval set; enqueues an async grading job.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "input",
            {
                description: "Eval set, enrollment, prompts, sampling params, and AI lane selection.",
            },
        )
            input: SubmitEvalChallengeInput,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<SubmitEvalChallengeResult> {
        return this.submitEvalChallengeService.execute({
            input,
            userId: user.id,
            locale,
        })
    }
}
