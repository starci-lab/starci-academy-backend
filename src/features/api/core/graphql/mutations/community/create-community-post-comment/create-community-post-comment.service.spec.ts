import {
    CreateCommunityPostCommentService
} from "./create-community-post-comment.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("CreateCommunityPostCommentService",
    () => { it("rejects missing users before delegation",
        async () => { await expect(new CreateCommunityPostCommentService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }) })
