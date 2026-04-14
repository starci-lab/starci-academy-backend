import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    TriggerCvSubmissionRequest,
    TriggerCvSubmissionResponse,
} from "./graphql-types"
import {
    TriggerCvSubmissionService,
} from "./trigger-cv-submission.service"

@Resolver()
export class TriggerCvSubmissionResolver {
    constructor(
        private readonly triggerCvSubmissionService: TriggerCvSubmissionService,
    ) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV processing queued successfully",
        [Locale.Vi]: "Đã xếp hàng xử lý CV thành công",
    })
    @Mutation(
        () => TriggerCvSubmissionResponse,
        {
            name: "triggerCvSubmission",
            description: "Manually queue CV submission processing after upload.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "CV submission to trigger.",
            },
        )
            request: TriggerCvSubmissionRequest,
    ): Promise<void> {
        await this.triggerCvSubmissionService.execute({
            user,
            request,
        })
    }
}