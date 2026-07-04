// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    AiMode,
} from "@modules/databases"
import type {
    UserEntity,
} from "@modules/databases"
import {
    UpdateMyAiSettingsCommand,
} from "./update-my-ai-settings.command"
import {
    UpdateMyAiSettingsHandler,
} from "./update-my-ai-settings.handler"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("UpdateMyAiSettingsHandler",
    () => {
        let module: TestingModule
        let handler: UpdateMyAiSettingsHandler
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "updateSettings">>

        beforeEach(async () => {
            // the domain service owns validation + encryption + persistence
            aiEntitlementService = {
                updateSettings: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "updateSettings">>

            module = await Test.createTestingModule({
                providers: [
                    UpdateMyAiSettingsHandler,
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
                    },
                ],
            }).compile()

            handler = module.get<UpdateMyAiSettingsHandler>(UpdateMyAiSettingsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no service call)",
            async () => {
                await expect(
                    handler.execute(
                        new UpdateMyAiSettingsCommand({
                            request: {
                                mode: AiMode.Auto,
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before delegating to the domain service
                expect(aiEntitlementService.updateSettings).not.toHaveBeenCalled()
            })

        it("forwards the resolved user id and the full settings payload to the service",
            async () => {
                await handler.execute(
                    new UpdateMyAiSettingsCommand({
                        request: {
                            mode: AiMode.Premium,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the user id is injected; every request field is passed through verbatim
                expect(aiEntitlementService.updateSettings).toHaveBeenCalledWith({
                    userId: "user-1",
                    mode: AiMode.Premium,
                })
            })
    })
