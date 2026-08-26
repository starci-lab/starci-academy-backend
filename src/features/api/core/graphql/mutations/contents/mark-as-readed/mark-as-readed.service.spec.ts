import {
    MarkAsReadedService
} from "./mark-as-readed.service"
describe("MarkAsReadedService",
    () => { it("delegates the complete execute params to CQRS",
        async () => { const commandBus = {
            execute: jest.fn().mockResolvedValue({
                touched: true
            })
        }; const params = {
            request: {
                contentId: "c"
            }, user: {
                id: "u"
            }
        }; await expect(new MarkAsReadedService(commandBus as never).execute(params as never)).resolves.toEqual({
            touched: true
        }); expect(commandBus.execute).toHaveBeenCalled() }) })
