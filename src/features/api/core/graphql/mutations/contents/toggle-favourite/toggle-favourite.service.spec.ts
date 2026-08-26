import {
    ToggleFavouriteService
} from "./toggle-favourite.service"
describe("ToggleFavouriteService",
    () => { it("delegates the request and user to CQRS",
        async () => { const commandBus = {
            execute: jest.fn().mockResolvedValue({
                isFavourite: true
            })
        }; await expect(new ToggleFavouriteService(commandBus as never).execute({
            request: {
                contentId: "c"
            }, user: {
                id: "u"
            }
        } as never)).resolves.toEqual({
            isFavourite: true
        }); expect(commandBus.execute).toHaveBeenCalled() }) })
