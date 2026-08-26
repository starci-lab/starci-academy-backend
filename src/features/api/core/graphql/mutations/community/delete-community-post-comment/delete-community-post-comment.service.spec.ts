import {
    DeleteCommunityPostCommentService
} from "./delete-community-post-comment.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("DeleteCommunityPostCommentService",
    () => { it("rejects unauthenticated deletion",
        async () => { await expect(new DeleteCommunityPostCommentService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }) })
