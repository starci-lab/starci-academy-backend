import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    buildDbSyncLogDisplayFields,
} from "./db-sync-log-metadata"

describe("buildDbSyncLogDisplayFields",
    () => {
        it("prefers displayId and falls back to orderIndex",
            () => {
                expect(buildDbSyncLogDisplayFields(CourseEntity.name,
                    {
                        displayId: "course",
                        orderIndex: 4,
                    })).toEqual({
                    displayId: "course", relativeDisplayIds: []
                })
                expect(buildDbSyncLogDisplayFields(CourseEntity.name,
                    {
                        orderIndex: 4,
                    })).toEqual({
                    displayId: "4", relativeDisplayIds: []
                })
                expect(buildDbSyncLogDisplayFields(CourseEntity.name,
                    {
                    })).toEqual({
                    displayId: "",
                    relativeDisplayIds: [],
                })
            })

        it("includes course ancestry for module-like entities and filters absent ids",
            () => {
                expect(buildDbSyncLogDisplayFields(ModuleEntity.name,
                    {
                        displayId: "lesson",
                        course: {
                            displayId: "course"
                        },
                    })).toEqual({
                    displayId: "lesson",
                    relativeDisplayIds: ["course"],
                })
                expect(buildDbSyncLogDisplayFields(MilestoneEntity.name,
                    {
                        displayId: "milestone",
                        course: {
                        },
                    })).toEqual({
                    displayId: "milestone", relativeDisplayIds: []
                })
            })

        it("marks content and challenge rows without verification as legacy",
            () => {
                expect(buildDbSyncLogDisplayFields(ContentEntity.name,
                    {
                        displayId: "content",
                        module: {
                            displayId: "module", course: {
                                displayId: "course"
                            }
                        },
                        verified: null,
                    })).toEqual({
                    displayId: "content",
                    relativeDisplayIds: ["course",
                        "module"],
                    isLegacy: true,
                })
                expect(buildDbSyncLogDisplayFields(ChallengeEntity.name,
                    {
                        orderIndex: 2,
                        content: {
                            displayId: "content", module: {
                                displayId: "module", course: {
                                    displayId: "course"
                                }
                            }
                        },
                        verified: new Date("2024-01-01T00:00:00.000Z"),
                    })).toEqual({
                    displayId: "2",
                    relativeDisplayIds: ["course",
                        "content",
                        "module"],
                })
            })

        it("builds milestone-task ancestry and uses the default branch for unknown kinds",
            () => {
                expect(buildDbSyncLogDisplayFields(MilestoneTaskEntity.name,
                    {
                        displayId: "task",
                        milestone: {
                            orderIndex: 3, course: {
                                displayId: "course"
                            }
                        },
                    })).toEqual({
                    displayId: "task",
                    relativeDisplayIds: ["course",
                        "3"],
                })
                expect(buildDbSyncLogDisplayFields("UnknownEntity",
                    {
                        displayId: "unknown",
                    })).toEqual({
                    displayId: "unknown", relativeDisplayIds: []
                })
            })
        it("does not synthesize ancestry from null or scalar relations",
            () => {
                expect(buildDbSyncLogDisplayFields(ContentEntity.name,
                    {
                        displayId: "content-null",
                        module: null,
                        verified: false,
                    } as never)).toEqual({
                    displayId: "content-null",
                    relativeDisplayIds: [],
                })
                expect(buildDbSyncLogDisplayFields(MilestoneTaskEntity.name,
                    {
                        orderIndex: 0,
                        milestone: "unresolved",
                    } as never)).toEqual({
                    displayId: "0",
                    relativeDisplayIds: [],
                })
            })
    })
