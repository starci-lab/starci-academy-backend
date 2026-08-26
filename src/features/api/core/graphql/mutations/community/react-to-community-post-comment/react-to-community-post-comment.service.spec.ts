import {
    ReactToCommunityPostCommentService
} from "./react-to-community-post-comment.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("ReactToCommunityPostCommentService",
    () => { it("rejects missing viewers",
        async () => { await expect(new ReactToCommunityPostCommentService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }) })
