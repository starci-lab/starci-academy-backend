import {
    Injectable,
} from "@nestjs/common"
import {
    ReactionService,
} from "@modules/bussiness/discussion/reaction.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion/object-types/reaction-summary.object"
import type {
    ContentReactionsRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Query service returning a content's aggregate reaction summary from the viewer's view.
 */
export class ContentReactionsService {
    constructor(
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Summarizes a content's reactions.
     * @param params - Execute params carrying the {@link ContentReactionsRequest} + user.
     * @returns The content's reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ContentReactionsRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // delegate to the domain service; the Result shape matches the GraphQL object
        return this.reactionService.summarizeContent({
            contentId: request.contentId,
            userId: user.id,
        })
    }
}
