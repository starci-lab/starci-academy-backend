import {
    SendGlobalChatMessageRequest, ReportGlobalChatRequest
} from "./request"

describe("global chat request contracts",
    () => {
        it("publishes input metadata and typed fields",
            () => {
                expect(Reflect.getMetadata("design:type",
                    SendGlobalChatMessageRequest.prototype,
                    "body")).toBe(String)
                expect(Reflect.getMetadata("design:type",
                    ReportGlobalChatRequest.prototype,
                    "messageId")).toBe(String)
            })
    })
