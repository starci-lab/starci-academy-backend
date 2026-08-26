import {
    SendChatMessageService
} from "./send-chat-message.service"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
describe("SendChatMessageService",
    () => { it("rejects missing users before chat delegation",
        async () => { await expect(new SendChatMessageService({
        } as never).execute({
            request: {
            } as never, user: undefined
        } as never)).rejects.toBeInstanceOf(UserNotFoundException) }) })
