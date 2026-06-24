import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityReactionService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import type {
    ReactToCommunityPostRequest,
} from "./graphql-types"

/**
 * Mutation service that sets/changes/removes the current user's reaction on a post.
 */
@Injectable()
export class ReactToCommunityPostService {
    constructor(
        private readonly communityReactionService: CommunityReactionService,
    ) {}

    /**
     * Applies a reaction change on a community post.
     * @param params - Execute params carrying the {@link ReactToCommunityPostRequest} + user.
     * @returns The post's refreshed reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ReactToCommunityPostRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // null/omitted type means "remove my reaction"
        return this.communityReactionService.reactToPost({
            postId: request.postId,
            user,
            type: request.type ?? null,
        })
    }
}
