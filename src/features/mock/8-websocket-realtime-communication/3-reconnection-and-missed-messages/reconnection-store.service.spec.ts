import {
    ReconnectionStoreService
} from "./reconnection-store.service"
import {
    CHAT_RING_CAP
} from "./constants/ring"

describe("ReconnectionStoreService",
    () => {
        it("assigns monotonic sequence numbers and replays only missed messages",
            () => {
                const service = new ReconnectionStoreService()
                expect(service.lastSeq("room")).toBe(0)
                service.append("room",
                    "u1",
                    "hello")
                service.append("room",
                    "u2",
                    "world")
                expect(service.lastSeq("room")).toBe(2)
                expect(service.replaySince("room",
                    1).map((message) => message.text)).toEqual(["world"])
                expect(service.replaySince("missing",
                    0)).toEqual([])
            })

        it("trims history to the configured ring capacity",
            () => {
                const service = new ReconnectionStoreService()
                for (let index = 0; index < CHAT_RING_CAP + 2; index += 1) {
                    service.append("room",
                        "u",
                        `message-${index}`)
                }
                const messages = service.replaySince("room",
                    0)
                expect(messages).toHaveLength(CHAT_RING_CAP)
                expect(messages[0].text).toBe("message-2")
            })
    })
