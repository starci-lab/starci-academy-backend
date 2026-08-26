import {
    CreatePlaygroundSessionHandler
} from "./create-playground-session.handler"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    PlaygroundNotFoundException
} from "@modules/platform/exceptions/errors/courses/playground-not-found"
import {
    PlaygroundNotEntitledException,
} from "@modules/platform/exceptions/errors/courses/playground-not-entitled"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PlaygroundSessionMode,
} from "@modules/databases/postgresql/primary/enums/playground-session-mode"

describe("CreatePlaygroundSessionHandler",
    () => {
        const command = (user?: { id: string }) => ({
            params: {
                request: {
                    playgroundId: "p"
                }, user
            }
        }) as never
        it("rejects unauthenticated requests before lookup",
            async () => {
                const manager = {
                    findOne: jest.fn()
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
{
} as never,
{
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command())).rejects.toBeInstanceOf(UserNotFoundException)
                expect(manager.findOne).not.toHaveBeenCalled()
            })
        it("rejects missing playgrounds",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null)
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
{
} as never,
{
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command({
                    id: "u"
                }))).rejects.toBeInstanceOf(PlaygroundNotFoundException)
            })
        it("rejects a user without an active enrollment before creating a session",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        steps: [],
                    }),
                }
                const entitlement = {
                    hasAnyActiveEnrollment: jest.fn().mockResolvedValue(false),
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
                    entitlement as never,
                    {
                    } as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command({
                    id: "u",
                }))).rejects.toBeInstanceOf(PlaygroundNotEntitledException)
                expect(entitlement.hasAnyActiveEnrollment).toHaveBeenCalledWith("u")
            })
        it("creates a guided session with default locale and localized steps",
            async () => {
                const step = {
                    title: "Run it",
                    body: "Run the command",
                    commandHint: "npm test",
                }
                const playground = {
                    id: "p",
                    steps: [step],
                }
                const created = {
                    id: "session",
                    pairingCode: "pairing",
                }
                const manager = {
                    findOne: jest.fn().mockResolvedValue(playground),
                    create: jest.fn().mockImplementation((_type: unknown, values: object) => ({
                        ...values,
                        ...created,
                    })),
                    save: jest.fn().mockResolvedValue(undefined),
                }
                const resolver = {
                    transformStep: jest.fn(),
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
                    {
                        hasAnyActiveEnrollment: jest.fn().mockResolvedValue(true),
                    } as never,
                    resolver as never)
                const result = await (handler as unknown as { process(command: unknown): Promise<{ id: string; mode: PlaygroundSessionMode; steps: Array<unknown> }> }).process({
                    params: {
                        request: {
                            playgroundId: "p",
                        },
                        user: {
                            id: "u",
                        },
                    },
                })

                expect(result).toEqual(expect.objectContaining({
                    id: "session",
                    pairingCode: "pairing",
                    mode: PlaygroundSessionMode.Guided,
                    steps: [step],
                }))
                expect(manager.create).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        mode: PlaygroundSessionMode.Guided,
                        connected: false,
                        currentStepIndex: 0,
                        passedStepIndexes: [],
                    }))
                expect(resolver.transformStep).toHaveBeenCalledWith(step,
                    Locale.En,
                    Locale.En)
            })
        it("redacts command hints in free mode and respects the requested locale",
            async () => {
                const steps = [{
                    title: "Step",
                    body: "Body",
                    commandHint: "secret command",
                }]
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        steps,
                    }),
                    create: jest.fn().mockImplementation((_type: unknown, values: object) => ({
                        ...values,
                        id: "session",
                        pairingCode: "pairing",
                    })),
                    save: jest.fn().mockResolvedValue(undefined),
                }
                const resolver = {
                    transformStep: jest.fn(),
                }
                const handler = new CreatePlaygroundSessionHandler(manager as never,
                    {
                        hasAnyActiveEnrollment: jest.fn().mockResolvedValue(true),
                    } as never,
                    resolver as never)
                const result = await (handler as unknown as { process(command: unknown): Promise<{ steps: Array<{ commandHint: string | null }> }> }).process({
                    params: {
                        request: {
                            playgroundId: "p",
                            mode: PlaygroundSessionMode.Free,
                        },
                        user: {
                            id: "u",
                        },
                        locale: Locale.Vi,
                    },
                })

                expect(result.steps).toEqual([{
                    ...steps[0], commandHint: null
                }])
                expect(resolver.transformStep).toHaveBeenCalledWith(steps[0],
                    Locale.Vi,
                    Locale.En)
            })
    })
