import {
    buildEntityRoute,
} from "./build-entity-route"
import {
    ChallengeEntity
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneEntity
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    MilestoneTaskEntity
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    ModuleEntity
} from "@modules/databases/postgresql/primary/entities/module.entity"

const parent = {
    course: {
        id: "course-id", displayId: "course"
    },
    module: {
        id: "module-id", displayId: "module"
    },
    content: {
        id: "content-id", displayId: "content"
    },
    task: {
        id: "task-id", displayId: "task"
    },
}

describe("buildEntityRoute",
    () => {
        it("builds canonical routes for entity kinds with complete ancestry",
            () => {
                expect(buildEntityRoute({
                    entityName: CourseEntity.name, id: "course-id", parentRef: parent
                })).toBe("/courses/course/".replace(/\/$/u,
                    ""))
                expect(buildEntityRoute({
                    entityName: ModuleEntity.name, id: "module-id", parentRef: parent
                })).toBe("/courses/course/learn/content/modules/module-id")
                expect(buildEntityRoute({
                    entityName: ContentEntity.name, id: "content-id", parentRef: parent
                })).toContain("/contents/content-id")
                expect(buildEntityRoute({
                    entityName: ChallengeEntity.name, id: "challenge-id", parentRef: parent
                })).toContain("/challenges/challenge-id")
                expect(buildEntityRoute({
                    entityName: MilestoneEntity.name, id: "milestone-id", parentRef: parent
                })).toContain("/personal-project/tasks/task-id")
                expect(buildEntityRoute({
                    entityName: MilestoneTaskEntity.name, id: "task-id", parentRef: parent
                })).toContain("/personal-project/tasks/task-id")
                expect(buildEntityRoute({
                    entityName: FlashcardDeckEntity.name, id: "deck-id", parentRef: parent
                })).toBe("/courses/course/learn/flashcards")
            })

        it("returns null for unknown kinds or missing ancestors and falls back milestone root",
            () => {
                expect(buildEntityRoute({
                    entityName: "UnknownEntity", id: "x"
                })).toBeNull()
                expect(buildEntityRoute({
                    entityName: ContentEntity.name, id: "x", parentRef: {
                        course: parent.course
                    }
                })).toBeNull()
                expect(buildEntityRoute({
                    entityName: MilestoneEntity.name, id: "x", parentRef: {
                        course: parent.course
                    }
                })).toBe("/courses/course/learn/personal-project")
                expect(buildEntityRoute({
                    entityName: CourseEntity.name, id: "x"
                })).toBeNull()
            })
    })
