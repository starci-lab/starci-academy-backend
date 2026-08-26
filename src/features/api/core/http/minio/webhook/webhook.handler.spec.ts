import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    MinioWebhookCommand,
} from "./webhook.command"
import {
    MinioWebhookHandler,
} from "./webhook.handler"

describe("MinioWebhookHandler",
    () => {
        it("logs receipt, ignores records without keys, and skips CV submission events",
            async () => {
                const log = jest.fn()
                const handler = new MinioWebhookHandler({
                    log,
                } as never)

                await expect(handler.execute(new MinioWebhookCommand({
                    Records: [
                        {
                            s3: {
                                object: {
                                },
                            },
                        },
                        {
                            s3: {
                                object: {
                                    key: "cv-submissions/cv-1.json",
                                },
                            },
                        },
                    ],
                } as never))).resolves.toBeUndefined()

                expect(log).toHaveBeenNthCalledWith(1,
                    WinstonLog.MinioWebhookReceived,
                    expect.objectContaining({
                        count: 2,
                    }))
                expect(log).toHaveBeenNthCalledWith(2,
                    WinstonLog.MinioWebhookIgnored,
                    expect.objectContaining({
                        meta: expect.objectContaining({
                            key: "cv-submissions/cv-1.json",
                        }),
                    }))
            })
    })
