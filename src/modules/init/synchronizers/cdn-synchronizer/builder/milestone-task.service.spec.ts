import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CdnMilestoneTaskBuildService,
} from "./milestone-task.service"

describe("CdnMilestoneTaskBuildService",
    () => {
        it("localizes a task and falls back to English when unspecified",
            async () => {
                const transform = jest.fn((entity: { localized?: Locale }, locale: Locale,
                    fallback: Locale) => {
                    entity.localized = locale
                    expect(fallback).toBe(Locale.En)
                })
                const service = new CdnMilestoneTaskBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "task-1"
                        })
                    } as never,
                    {
                        transform
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                const localized = await service.buildMultilingualByMilestoneTaskId("task-1")

                expect(localized).toHaveLength(2)
                const entities = localized as unknown as Array<{ entity: { localized?: Locale } }>
                expect(entities.map((entry) => entry.entity.localized)).toEqual([Locale.Vi,
                    Locale.En])
                expect(transform).toHaveBeenCalledTimes(2)
            })

        it("materializes a task and delegates its id/locale key resolver",
            async () => {
                let resolveObjectKey: ((id: string, locale: Locale) => string) | undefined
                const process = jest.fn(async (...args: unknown[]) => {
                    resolveObjectKey = args[1] as (id: string, locale: Locale) => string
                })
                const service = new CdnMilestoneTaskBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "task-2"
                        })
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                    {
                        milestoneTask: jest.fn((id: string, locale: Locale) => `${id}-${locale}`)
                    } as never,
                    {
                        process
                    } as never,
                )

                await service.materializeAndUpload("task-2")

                expect(process).toHaveBeenCalledTimes(1)
                expect(resolveObjectKey?.("task-2",
                    Locale.En)).toBe("task-2-en")
            })
    })
