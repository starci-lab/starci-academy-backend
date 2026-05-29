import {
    Args,
    ID,
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
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    QuizDeckEntity,
} from "@modules/databases"
import {
    QuizDeckReadService,
} from "@modules/bussiness"
import {
    QuizDeckResponse,
} from "./graphql-types"

/**
 * Returns a single interview-prep quiz deck by id, with its cards, options,
 * and translations eagerly loaded for the study modes.
 */
@Resolver()
export class QuizDeckResolver {
    constructor(
        private readonly quizDeckReadService: QuizDeckReadService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Quiz deck fetched successfully",
        [Locale.Vi]: "Lấy bộ thẻ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => QuizDeckResponse,
        {
            name: "quizDeck",
            description: "Returns a single quiz deck by id.",
        },
    )
    async execute(
        @Args("quizDeckId",
            {
                type: () => ID,
            })
            quizDeckId: string,
    ): Promise<QuizDeckEntity> {
        // load the full deck graph; throws a typed 404 when missing
        return this.quizDeckReadService.getById(quizDeckId)
    }
}
