import {
    FoundationEntity,
    MilestoneEntity,
} from "@modules/databases"
import {
    InitConfigParserService,
} from "./init-config-parser.service"

describe("InitConfigParserService",
    () => {
        let service: InitConfigParserService

        beforeEach(() => {
            // pure transform, no DI graph
            service = new InitConfigParserService()
        })

        describe("seed block",
            () => {
                it("disables the seed phase when the block is absent",
                    () => {
                        const config = service.parse({
                            sync: {
                            },
                        },
                        [])

                        expect(config.seeders.enabled).toBe(false)
                    })

                it("expands a shorthand course to modules-only (milestones/flashcards off)",
                    () => {
                        const config = service.parse({
                            seed: {
                                courses: {
                                    "fullstack-mastery": "all",
                                },
                            },
                        },
                        [])

                        expect(config.seeders.enabled).toBe(true)
                        expect(config.seeders.courses.tracks["fullstack-mastery"]).toEqual({
                            course: true,
                            modules: "all",
                            milestones: [],
                        })
                        expect(config.seeders.courses.flashcard.enabled).toBe(false)
                    })

                it("expands the object form (milestones:true → all) + global flashcard flag",
                    () => {
                        const config = service.parse({
                            seed: {
                                courses: {
                                    "fullstack-mastery": {
                                        modules: "0-3",
                                        milestones: true,
                                        flashcards: true,
                                    },
                                },
                                foundations: true,
                            },
                        },
                        [])

                        expect(config.seeders.courses.tracks["fullstack-mastery"]).toEqual({
                            course: true,
                            modules: "0-3",
                            milestones: "all",
                        })
                        // flashcard is a single global pass -> on because a course opted in
                        expect(config.seeders.courses.flashcard.enabled).toBe(true)
                        expect(config.seeders.foundations).toBe(true)
                        expect(config.seeders.headhunting).toBe(false)
                    })
            })

        describe("sync block",
            () => {
                it("disables the sync phase when the block is absent",
                    () => {
                        const config = service.parse({
                            seed: {
                            },
                        },
                        [])

                        expect(config.synchronizers.enabled).toBe(false)
                    })

                it("expands a shorthand course to every sink of both tracks",
                    () => {
                        const config = service.parse({
                            sync: {
                                courses: {
                                    "fullstack-mastery": "all",
                                },
                            },
                        },
                        [])

                        expect(config.synchronizers.courses["fullstack-mastery"]).toEqual({
                            course: true,
                            modules: {
                                cdn: "all",
                                elasticsearch: "all",
                                repo: "all",
                            },
                            milestones: {
                                cdn: "all",
                                elasticsearch: "all",
                                repo: "all",
                            },
                        })
                    })

                it("resolves the per-sink object form (omitted sinks/tracks default off)",
                    () => {
                        const config = service.parse({
                            sync: {
                                courses: {
                                    "fullstack-mastery": {
                                        modules: {
                                            elasticsearch: "all",
                                        },
                                    },
                                },
                            },
                        },
                        [])

                        expect(config.synchronizers.courses["fullstack-mastery"]).toEqual({
                            course: true,
                            modules: {
                                cdn: [],
                                elasticsearch: "all",
                                repo: [],
                            },
                            milestones: {
                                cdn: [],
                                elasticsearch: [],
                                repo: [],
                            },
                        })
                    })

                it("zeros a sink across every track when the master `sinks` switch is false",
                    () => {
                        const config = service.parse({
                            sync: {
                                sinks: {
                                    cdn: false,
                                },
                                courses: {
                                    "fullstack-mastery": "all",
                                },
                            },
                        },
                        [])

                        const track = config.synchronizers.courses["fullstack-mastery"]
                        expect(track.modules.cdn).toEqual([])
                        expect(track.modules.elasticsearch).toBe("all")
                        expect(track.modules.repo).toBe("all")
                    })

                it("resolves domains as per-sink (bool → both, object → explicit)",
                    () => {
                        const config = service.parse({
                            sync: {
                                foundations: true,
                                codingProblems: {
                                    elasticsearch: true,
                                },
                            },
                        },
                        [])

                        expect(config.synchronizers.foundations).toEqual({
                            cdn: true,
                            elasticsearch: true,
                        })
                        expect(config.synchronizers.codingProblems).toEqual({
                            cdn: false,
                            elasticsearch: true,
                        })
                    })
            })

        describe("reindex",
            () => {
                it("resolves `none`/absent to an empty list",
                    () => {
                        expect(service.parse({
                            sync: {
                                reindex: "none",
                            },
                        },
                        []).synchronizers.reindex).toEqual([])
                        expect(service.parse({
                            sync: {
                            },
                        },
                        []).synchronizers.reindex).toEqual([])
                    })

                it("resolves `all` to every configured index entity",
                    () => {
                        const config = service.parse({
                            sync: {
                                reindex: "all",
                            },
                        },
                        [])

                        // 12 indices in configMap
                        expect(config.synchronizers.reindex.length).toBe(12)
                        expect(config.synchronizers.reindex).toContain(MilestoneEntity.name)
                    })

                it("resolves a friendly index name AND forces its ES sync to full per course",
                    () => {
                        const config = service.parse({
                            sync: {
                                reindex: [
                                    "milestones",
                                ],
                            },
                        },
                        [
                            "fullstack-mastery",
                            "system-design-mastery",
                        ])

                        expect(config.synchronizers.reindex).toEqual([
                            MilestoneEntity.name,
                        ])
                        // every course's milestones ES sync forced to full so the
                        // dropped milestones index is fully repopulated
                        for (const displayId of [
                            "fullstack-mastery",
                            "system-design-mastery",
                        ]) {
                            const track = config.synchronizers.courses[displayId]
                            expect(track.course).toBe(true)
                            expect(track.milestones.elasticsearch).toBe("all")
                            // modules untouched (not reindexed)
                            expect(track.modules.elasticsearch).toEqual([])
                        }
                    })

                it("forces a domain's ES sync to full when its index is reindexed",
                    () => {
                        const config = service.parse({
                            sync: {
                                reindex: [
                                    "foundations",
                                ],
                            },
                        },
                        [])

                        expect(config.synchronizers.reindex).toEqual([
                            FoundationEntity.name,
                        ])
                        expect(config.synchronizers.foundations.elasticsearch).toBe(true)
                    })

                it("drops unknown friendly names instead of failing",
                    () => {
                        const config = service.parse({
                            sync: {
                                reindex: [
                                    "nope",
                                    "modules",
                                ],
                            },
                        },
                        [])

                        expect(config.synchronizers.reindex).not.toContain("nope")
                        expect(config.synchronizers.reindex.length).toBe(1)
                    })
            })
    })
