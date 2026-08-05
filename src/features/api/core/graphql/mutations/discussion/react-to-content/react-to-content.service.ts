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
    ReactToContentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that sets/changes/removes the current user's reaction on a content.
 */
export class ReactToContentService {
    constructor(
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Applies a reaction change on a content.
     * @param params - Execute params carrying the {@link ReactToContentRequest} + user.
     * @returns The content's refreshed reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ReactToContentRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // null/omitted type means "remove my reaction"
        return this.reactionService.reactToContent({
            contentId: request.contentId,
            user,
            type: request.type ?? null,
        })
    }
}
