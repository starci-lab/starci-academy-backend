import {
    ReactToCommunityPostService
} from "./react-to-community-post.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("ReactToCommunityPostService",
    () => { it("rejects missing viewers",
        async () => { await expect(new ReactToCommunityPostService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }); it("delegates omitted reaction as removal",
        async () => { const reaction = {
            reactToPost: jest.fn().mockResolvedValue({
                total: 0
            })
        }; await expect(new ReactToCommunityPostService(reaction as never).execute({
            request: {
                postId: "p"
            }, user: {
                id: "u"
            }
        } as never)).resolves.toEqual({
            total: 0
        }); expect(reaction.reactToPost).toHaveBeenCalledWith(expect.objectContaining({
            postId: "p", type: null
        })) }) })
