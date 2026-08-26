// Load the bussiness barrel first so its CQRS base classes initialise before
// the handler pulls `@modules/cqrs` -- dodges a load-order "Class extends value
// undefined" cycle (mirrors generate-cv.handler.spec.ts).
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    SplitCvFromTextCommand,
} from "./split-cv-from-text.command"
import {
    SplitCvFromTextHandler,
} from "./split-cv-from-text.handler"

/** Minimal user stand-in carrying only the id the handler reads. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** One block returned by `execute`. */
interface ParsedBlock {
    id: string
    type: string
    title: string
    order: number
    items: Array<{ id: string, fields: Record<string, unknown> }>
}

describe("SplitCvFromTextHandler",
    () => {
        let module: TestingModule
        let handler: SplitCvFromTextHandler
        let aiInvokeService: jest.Mocked<Pick<AiInvokeService, "run">>

        /** Point the mocked AI at a canned raw reply, then run the handler. */
        const runWith = async (
            raw: string,
        ): Promise<Array<ParsedBlock>> => {
            aiInvokeService.run.mockResolvedValueOnce({
                text: raw,
            } as never)
            const result = await handler.execute(
                new SplitCvFromTextCommand({
                    request: {
                        text: "some pasted CV text",
                    },
                    user: fakeUser("user-1"),
                    locale: Locale.Vi,
                }),
            )
            return (result as unknown as { blocks: Array<ParsedBlock> }).blocks
        }

        beforeEach(async () => {
            aiInvokeService = {
                run: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiInvokeService, "run">>

            module = await Test.createTestingModule({
                providers: [
                    SplitCvFromTextHandler,
                    {
                        provide: AiInvokeService,
                        useValue: aiInvokeService,
                    },
                ],
            }).compile()

            handler = module.get<SplitCvFromTextHandler>(SplitCvFromTextHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("guards (before any AI invoke)",
            () => {
                it("throws when there is no authenticated user",
                    async () => {
                        await expect(
                            handler.execute(
                                new SplitCvFromTextCommand({
                                    request: {
                                        text: "cv",
                                    },
                                    user: undefined,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(UserNotFoundException)
                        expect(aiInvokeService.run).not.toHaveBeenCalled()
                    })

                it("throws on empty / whitespace-only text",
                    async () => {
                        await expect(
                            handler.execute(
                                new SplitCvFromTextCommand({
                                    request: {
                                        text: "   ",
                                    },
                                    user: fakeUser("user-1"),
                                }),
                            ),
                        ).rejects.toThrow()
                        expect(aiInvokeService.run).not.toHaveBeenCalled()
                    })
            })

        describe("shape contract — items are ALWAYS `{ id, fields }`, never raw strings",
            () => {
                it("keeps a well-formed per-type reply (fields preserved, item ids generated)",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                id: "exp",
                                type: "experience",
                                title: "Experience",
                                order: 1,
                                items: [
                                    {
                                        id: "whatever",
                                        fields: {
                                            company: "Company X",
                                            role: "Backend Developer",
                                            startDate: "2022",
                                            endDate: "2024",
                                            bullets: "Built API\nOptimized",
                                        },
                                    },
                                ],
                            },
                        ]))

                        expect(blocks).toHaveLength(1)
                        const block = blocks[0]
                        expect(block.type).toBe("experience")
                        expect(block.items[0].id).toBe("item-0-0")
                        expect(block.items[0].fields).toEqual({
                            company: "Company X",
                            role: "Backend Developer",
                            startDate: "2022",
                            endDate: "2024",
                            bullets: "Built API\nOptimized",
                        })
                    })

                it("REGRESSION: salvages `items: string[]` (the old bug) into `{id, fields}` by PRIMARY key",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                id: "skills",
                                type: "skills",
                                title: "Skills",
                                order: 0,
                                items: ["TypeScript",
                                    "PostgreSQL"],
                            },
                            {
                                id: "exp",
                                type: "experience",
                                title: "Experience",
                                order: 1,
                                items: ["Backend dev at X"],
                            },
                        ]))

                        // skills strings -> { name: <string> }
                        expect(blocks[0].items).toEqual([
                            {
                                id: "item-0-0", fields: {
                                    name: "TypeScript"
                                }
                            },
                            {
                                id: "item-0-1", fields: {
                                    name: "PostgreSQL"
                                }
                            },
                        ])
                        // experience string -> primary key `bullets`
                        expect(blocks[1].items[0].fields).toEqual({
                            bullets: "Backend dev at X"
                        })
                        // never a raw string anywhere
                        for (const block of blocks) {
                            for (const item of block.items) {
                                expect(typeof item).toBe("object")
                                expect(typeof item.fields).toBe("object")
                            }
                        }
                    })

                it("treats a top-level-fields item (no `.fields` wrapper) as its fields",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                id: "edu",
                                type: "education",
                                title: "Education",
                                order: 0,
                                items: [
                                    {
                                        school: "HCMUS", degree: "CS", startDate: "2018", endDate: "2022"
                                    },
                                ],
                            },
                        ]))
                        expect(blocks[0].items[0].fields).toEqual({
                            school: "HCMUS",
                            degree: "CS",
                            startDate: "2018",
                            endDate: "2022",
                        })
                    })

                it("joins an array `bullets` value into newline-separated text + stringifies scalars",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                id: "exp",
                                type: "experience",
                                title: "Experience",
                                order: 0,
                                items: [
                                    {
                                        fields: {
                                            role: "Dev", bullets: ["Line A",
                                                "Line B"], startDate: 2022
                                        }
                                    },
                                ],
                            },
                        ]))
                        expect(blocks[0].items[0].fields).toEqual({
                            role: "Dev",
                            bullets: "Line A\nLine B",
                            startDate: "2022",
                        })
                    })
            })

        describe("normalization",
            () => {
                it("coerces an unknown block type to `summary`",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                id: "x", type: "hobbies-and-pets", title: "?", order: 0, items: [{
                                    fields: {
                                        text: "hi"
                                    }
                                }]
                            },
                        ]))
                        expect(blocks[0].type).toBe("summary")
                    })

                it("clamps a single-item type (`personal`) to the first item only",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                id: "p",
                                type: "personal",
                                title: "Personal info",
                                order: 0,
                                items: [
                                    {
                                        fields: {
                                            name: "A"
                                        }
                                    },
                                    {
                                        fields: {
                                            name: "B (should be dropped)"
                                        }
                                    },
                                ],
                            },
                        ]))
                        expect(blocks[0].items).toHaveLength(1)
                        expect(blocks[0].items[0].fields).toEqual({
                            name: "A"
                        })
                    })

                it("falls back the block id + order when the model omits them",
                    async () => {
                        const blocks = await runWith(JSON.stringify([
                            {
                                type: "summary", items: [{
                                    fields: {
                                        text: "hi"
                                    }
                                }]
                            },
                        ]))
                        expect(blocks[0].id).toBe("block-0")
                        expect(blocks[0].order).toBe(0)
                    })

                it("drops blank, array, and unsupported field values during salvage",
                    async () => {
                        const blocks = await runWith(JSON.stringify([{
                            type: "experience",
                            items: [
                                "   ",
                                ["not",
                                    "an",
                                    "object"],
                                null,
                                {
                                    fields: {
                                        title: "   ",
                                        bullets: ["Built",
                                            7,
                                            " APIs"],
                                        remote: true,
                                        hidden: null,
                                    },
                                },
                            ],
                        }]))

                        expect(blocks[0].items[0].fields).toEqual({
                        })
                        expect(blocks[0].items[1].fields).toEqual({
                        })
                        expect(blocks[0].items[2].fields).toEqual({
                        })
                        expect(blocks[0].items[3].fields).toEqual({
                            bullets: "Built\n APIs",
                            remote: "true",
                        })
                    })
            })

        describe("defensive parsing",
            () => {
                it("throws on invalid JSON",
                    async () => {
                        await expect(runWith("not json at all {")).rejects.toThrow()
                    })

                it("throws when the reply is a JSON object, not an array",
                    async () => {
                        await expect(runWith(JSON.stringify({
                            blocks: []
                        }))).rejects.toThrow()
                    })

                it("tolerates a fenced ```json block around the array",
                    async () => {
                        const blocks = await runWith("```json\n[{\"type\":\"summary\",\"items\":[{\"fields\":{\"text\":\"hi\"}}]}]\n```")
                        expect(blocks[0].items[0].fields).toEqual({
                            text: "hi"
                        })
                    })
            })
    })
