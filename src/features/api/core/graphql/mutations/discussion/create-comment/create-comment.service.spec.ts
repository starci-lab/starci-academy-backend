import {
    CreateCommentService
} from "./create-comment.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("CreateCommentService",
    () => {
        it("rejects an absent authenticated user before writing",
            async () => {
                const service = new CreateCommentService({
                    createComment: jest.fn()
                } as never,
{
    findOne: jest.fn()
} as never)
                await expect(service.execute({
                    request: {
                        body: "hello"
                    } as never, user: undefined
                } as never)).rejects.toBeInstanceOf(UserNotFoundException)
            })
    })
