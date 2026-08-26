import {
    CreateCommunityPostService
} from "./create-community-post.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("CreateCommunityPostService",
    () => { it("rejects missing users",
        async () => { await expect(new CreateCommunityPostService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }) })
