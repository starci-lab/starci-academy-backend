/* eslint-disable starci-be/e2e-asserts-persisted-state -- The business consequence of this transport flow is the event delivered on another instance; it intentionally has no database state. */
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import type {
    ChatMessageChangedEventPayload,
} from "@modules/platform/event/types/event-payload/chat"
import {
    createNatsCrossInstanceApp,
} from "@tests/helpers/nats-cross-instance-world"
import type {
    NatsCrossInstanceApp,
} from "@tests/helpers/nats-cross-instance-world"

const until = async (predicate: () => boolean): Promise<void> => {
    const deadline = Date.now() + 5_000
    while (!predicate()) {
        if (Date.now() >= deadline) {
            throw new Error("Cross-instance NATS event was not delivered before the deadline")
        }
        await new Promise<void>(resolve => setImmediate(resolve))
    }
}

describe("cross-instance event routing",
    () => {
        let origin: NatsCrossInstanceApp
        let recipient: NatsCrossInstanceApp

        beforeAll(async () => {
            origin = await createNatsCrossInstanceApp()
            recipient = await createNatsCrossInstanceApp()
            await Promise.all([
                origin.untilReady(),
                recipient.untilReady(),
            ])
        })

        afterAll(async () => {
            await Promise.all([
                origin.close(),
                recipient.close(),
            ])
        })

        it("routes a production event from instance A to instance B exactly once without echoing twice on A",
            async () => {
                const payload: ChatMessageChangedEventPayload = {
                    conversationId: "conversation-cross-instance",
                    messageId: "message-cross-instance",
                    authorId: "member-cross-instance",
                }
                const originDeliveries: Array<ChatMessageChangedEventPayload> = []
                const recipientDeliveries: Array<ChatMessageChangedEventPayload> = []
                origin.events.on({
                    event: EventName.ChatMessageCreated,
                    listener: delivered => originDeliveries.push(delivered),
                })
                recipient.events.on({
                    event: EventName.ChatMessageCreated,
                    listener: delivered => recipientDeliveries.push(delivered),
                })

                await origin.events.emit({
                    event: EventName.ChatMessageCreated,
                    payload,
                })

                await until(() => recipientDeliveries.length === 1)
                await until(() => originDeliveries.length === 1)
                // Wait until both production bridges have consumed the broker
                // envelope. Only then can the origin assertion prove that its
                // NATS echo was filtered instead of merely arriving later.
                await until(() => origin.getBrokerMessageCount() === 1)
                await until(() => recipient.getBrokerMessageCount() === 1)

                expect(recipientDeliveries).toEqual([payload])
                expect(originDeliveries).toEqual([payload])
            })
    })
