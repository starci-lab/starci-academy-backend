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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    GradeInterviewAnswerRequest,
    GradeInterviewAnswerResponse,
} from "./graphql-types"
import {
    GradeInterviewAnswerService,
} from "./grade-interview-answer.service"

@Resolver()
export class GradeInterviewAnswerResolver {
    constructor(
        private readonly gradeInterviewAnswerService: GradeInterviewAnswerService,
    ) { }

    /**
     * Grades a candidate's transcribed answer to an interview flashcard against
     * the card's model answer. Stateless — nothing is persisted.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview answer graded successfully",
        [Locale.Vi]: "Chấm câu trả lời phỏng vấn thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard, GraphQLMustEnrolledGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => GradeInterviewAnswerResponse,
        {
            name: "gradeInterviewAnswer",
            description: "Grades a transcribed interview answer against a flashcard's model answer.",
        },
    )
    async execute(
        @Args("request")
            request: GradeInterviewAnswerRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.gradeInterviewAnswerService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
