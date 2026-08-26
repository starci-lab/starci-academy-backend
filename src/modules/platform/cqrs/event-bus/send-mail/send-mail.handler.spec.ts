import {
    SendMailEventHandler
} from "./send-mail.handler"
import {
    SendMailEvent
} from "./send-mail.event"

describe("SendMailEventHandler",
    () => {
        it("enqueues the payload and logs recipient addresses",
            async () => {
                const enqueue = jest.fn().mockResolvedValue(undefined)
                const log = jest.fn()
                const handler = new SendMailEventHandler({
                    enqueue
                } as never,
{
    log
} as never)
                const event = new SendMailEvent({
                    to: [{
                        address: "a@example.test"
                    }], subject: "Hello"
                } as never)
                await expect(handler.execute(event)).resolves.toBeUndefined()
                expect(enqueue).toHaveBeenCalledWith(event.payload)
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        meta: {
                            recipients: ["a@example.test"]
                        }
                    }))
            })
    })
