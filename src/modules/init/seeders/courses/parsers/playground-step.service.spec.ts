import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PlaygroundStepParserService,
} from "./playground-step.service"

describe("PlaygroundStepParserService",
    () => {
        const createDependencies = () => {
            const extract = jest.fn().mockReturnValue({
                title: "Title",
                body: "Body",
                sortIndex: "not-a-number",
            })
            const load = jest.fn().mockResolvedValue("markdown")
            const merge = jest.fn().mockReturnValue({
                title: "Merged title",
                body: "Merged body",
                sortIndex: "7",
                commandHint: "run",
                actionHint: null,
                verifyKind: "http",
                verifyResourceKind: "endpoint",
                verifyResourceNamePattern: "/health",
                verifyExpectedStatus: "200",
                translations: [{
                    locale: Locale.En,
                    field: "title",
                    value: "Merged title",
                }],
            })
            const toRequiredString = jest.fn(
                (value: unknown, fallback: string) => typeof value === "string" ? value : fallback,
            )
            const toNullableStringColumn = jest.fn(
                (value: unknown) => typeof value === "string" ? value : null,
            )
            const idFactory = jest.fn().mockReturnValue("step-1")
            const service = new PlaygroundStepParserService(
                {
                    paths: jest.fn().mockResolvedValue([{
                        orderIndex: 3,
                        relativePath: "course/playground/steps/3-step",
                    }]),
                } as never,
                {
                    load,
                } as never,
                {
                    extract,
                } as never,
                {
                    toRequiredString,
                    toNullableStringColumn,
                } as never,
                {
                    merge,
                } as never,
                {
                    generate: idFactory,
                } as never,
            )
            return {
                service,
                extract,
                load,
                merge,
                toRequiredString,
                toNullableStringColumn,
                idFactory,
            }
        }

        it("loads both locales, merges fields, and builds translated step rows",
            async () => {
                const setup = createDependencies()

                const result = await setup.service.parseMany({
                    playgroundRelativePath: "course/playground",
                    courseIndex: 1,
                    playgroundIndex: 2,
                    playgroundId: "playground-1",
                })

                expect(setup.load).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(setup.extract).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(setup.idFactory).toHaveBeenCalledWith({
                    courseIndex: 1,
                    playgroundIndex: 2,
                    playgroundStepIndex: 3,
                })
                expect(result).toEqual([expect.objectContaining({
                    id: "step-1",
                    sortIndex: 7,
                    title: "Merged title",
                    body: "Merged body",
                    commandHint: "run",
                    actionHint: null,
                    verifyKind: "http",
                    verifyExpectedStatus: "200",
                    playground: {
                        id: "playground-1",
                    },
                    translations: [{
                        playgroundStep: {
                            id: "step-1",
                        },
                        locale: Locale.En,
                        field: "title",
                        value: "Merged title",
                    }],
                })])
            })

        it("falls back to the folder order when sortIndex is not finite",
            async () => {
                const setup = createDependencies()
                setup.merge.mockReturnValueOnce({
                    title: "Title",
                    body: "Body",
                    sortIndex: "NaN",
                })

                const result = await setup.service.parseMany({
                    playgroundRelativePath: "course/playground",
                    courseIndex: 1,
                    playgroundIndex: 2,
                    playgroundId: "playground-1",
                })

                expect(result[0]?.sortIndex).toBe(3)
            })

        it("returns no steps when the playground has no step folders",
            async () => {
                const paths = jest.fn().mockResolvedValue([])
                const service = new PlaygroundStepParserService(
                    {
                        paths,
                    } as never,
                    {
                        load: jest.fn(),
                    } as never,
                    {
                        extract: jest.fn(),
                    } as never,
                    {
                        toRequiredString: jest.fn(),
                        toNullableStringColumn: jest.fn(),
                    } as never,
                    {
                        merge: jest.fn(),
                    } as never,
                    {
                        generate: jest.fn(),
                    } as never,
                )

                await expect(service.parseMany({
                    playgroundRelativePath: "empty",
                    courseIndex: 0,
                    playgroundIndex: 0,
                    playgroundId: "playground-0",
                })).resolves.toEqual([])
            })
    })
