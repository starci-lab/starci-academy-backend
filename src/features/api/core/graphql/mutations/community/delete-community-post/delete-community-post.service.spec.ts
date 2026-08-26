import {
    DeleteCommunityPostService
} from "./delete-community-post.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("DeleteCommunityPostService",
    () => { it("rejects unauthenticated deletion",
        async () => { await expect(new DeleteCommunityPostService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }) })
