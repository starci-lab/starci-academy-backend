import {
    PlaygroundSeedTestCommand
} from "./playground-seed-test.command"

describe("PlaygroundSeedTestCommand",
    () => {
        it("counts each playground table for the confirmed course",
            async () => {
                const manager = {
                    count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3).mockResolvedValueOnce(4)
                }
                const command = new PlaygroundSeedTestCommand({
                    log: jest.fn()
                } as never,
{
    process: jest.fn()
} as never,
{
    generate: jest.fn().mockReturnValue("course")
} as never,
manager as never)
                await expect((command as unknown as { countRows(courseId: string): Promise<unknown> }).countRows("course")).resolves.toEqual({
                    playgrounds: 1, playgroundSteps: 2, playgroundTranslations: 3, playgroundStepTranslations: 4
                })
                expect(manager.count).toHaveBeenCalledTimes(4)
            })

        it("formats every playground counter in the command summary order",
            () => {
                const command = new PlaygroundSeedTestCommand({
                    log: jest.fn(),
                } as never,
                {
                    process: jest.fn(),
                } as never,
                {
                    generate: jest.fn(),
                } as never,
                {
                    count: jest.fn(),
                } as never)

                const formatRowCounts = (command as unknown as {
                    formatRowCounts: (counts: {
                        playgrounds: number
                        playgroundSteps: number
                        playgroundTranslations: number
                        playgroundStepTranslations: number
                    }) => string
                }).formatRowCounts

                expect(formatRowCounts({
                    playgrounds: 1,
                    playgroundSteps: 2,
                    playgroundTranslations: 3,
                    playgroundStepTranslations: 4,
                })).toBe("playgrounds=1, playgroundSteps=2, playgroundTranslations=3, playgroundStepTranslations=4")
            })
    })
