import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
    ModuleEntity,
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    RetryService,
} from "@modules/mixin"
import {
    ChallengeInsertService,
    ContentInsertService,
    CourseInsertService,
    LessonVideoInsertService,
    MilestoneInsertService,
    MilestoneTaskInsertService,
    ModuleInsertService,
} from "./inserts"
import {
    ChallengeParserService,
    ContentParserService,
    CourseParserService,
    LessonVideoParserService,
    MilestoneParserService,
    MilestoneTaskParserService,
    ModuleParserService,
} from "./parsers"

/**
 * Wraps the full course + milestone init seed pipeline (parse → upsert per table).
 * Keeps orchestration colocated under `seeders/courses` instead of `SeedersService`.
 */
@Injectable()
export class CourseSeederService {
    constructor(
        private readonly courseParserService: CourseParserService,
        private readonly moduleParserService: ModuleParserService,
        private readonly challengeParserService: ChallengeParserService,
        private readonly lessonVideoParserService: LessonVideoParserService,
        private readonly contentParserService: ContentParserService,
        private readonly courseInsertService: CourseInsertService,
        private readonly moduleInsertService: ModuleInsertService,
        private readonly contentInsertService: ContentInsertService,
        private readonly lessonVideoInsertService: LessonVideoInsertService,
        private readonly challengeInsertService: ChallengeInsertService,
        private readonly milestoneParserService: MilestoneParserService,
        private readonly milestoneTaskParserService: MilestoneTaskParserService,
        private readonly milestoneInsertService: MilestoneInsertService,
        private readonly milestoneTaskInsertService: MilestoneTaskInsertService,
        private readonly retryService: RetryService,
    ) { }

    /**
     * Parse course markdown/S3 sources and upsert PostgreSQL (courses → modules → … → milestones).
     */
    async seed(): Promise<void> {
        /** The courses to seed. */
        const courses: Array<DeepPartial<CourseEntity>> = []
        /** The course results to seed. */
        const courseResults = await this.courseParserService.parseMany()
        /** We push the courses to the array by parsing the course results. */
        for (const courseResult of courseResults) {
            courses.push(courseResult.data)
        }
        /** We parse the modules for each course. */
        for (const courseResult of courseResults) {
            /** The modules to seed. */
            const modules: Array<DeepPartial<ModuleEntity>> = []
            /** The module results to seed. */
            const moduleResults = await this.moduleParserService.parseMany(
                {
                    courseRelativePath: courseResult.relativePath,
                    courseIndex: courseResult.index,
                },
            )
            /** We push the modules to the array by parsing the module results. */
            for (const moduleResult of moduleResults) {
                modules.push(moduleResult.data)
                /** The contents to seed. */
                const contents: Array<DeepPartial<ContentEntity>> = []
                /** The content results to seed. */
                const contentResults = await this.contentParserService.parseMany(
                    {
                        moduleRelativePath: moduleResult.relativePath,
                        courseIndex: courseResult.index,
                        moduleIndex: moduleResult.index,
                    },
                )
                /** We push the contents to the array by parsing the content results. */
                for (const contentResult of contentResults) {
                    contents.push(contentResult.data)
                }

                /** Attach contents to the current module. */
                moduleResult.data.contents = contents

                /** We find challenges for each content. */
                for (const contentResult of contentResults) {
                    const challenges: Array<DeepPartial<ChallengeEntity>> = []
                    const challengeResults = await this.challengeParserService.parseMany(
                        {
                            contentRelativePath: contentResult.relativePath,
                            courseIndex: courseResult.index,
                            moduleIndex: moduleResult.index,
                            contentIndex: contentResult.index,
                        },
                    )
                    for (const challengeResult of challengeResults) {
                        challenges.push(challengeResult.data)
                    }
                    const content = contents.find(
                        (content) => content.id === contentResult.data.id
                    )
                    if (content) {
                        content.challenges = challenges
                    }
                }

                /** We find lesson videos for each content. */
                for (const contentResult of contentResults) {
                    const lessonVideos: Array<DeepPartial<LessonVideoEntity>> = []
                    const lessonVideoResults = await this.lessonVideoParserService.parseMany(
                        {
                            contentRelativePath: contentResult.relativePath,
                            courseIndex: courseResult.index,
                            moduleIndex: moduleResult.index,
                            contentIndex: contentResult.index,
                        },
                    )
                    for (const lessonVideoResult of lessonVideoResults) {
                        lessonVideos.push(lessonVideoResult.data)
                    }
                    const content = contents.find(
                        (content) => content.id === contentResult.data.id
                    )
                    if (content) {
                        content.lessons = lessonVideos
                    }
                }
            }

            /** We find the corresponding course in the courses array. */
            const course = courses.find(
                (course) => course.id === courseResult.data.id
            )
            if (course) {
                course.modules = modules
            }
        }

        /** Upsert each course and its children table-by-table. */
        for (const course of courses) {
            const courseId = course.id as string

            /** 1. Upsert course-level tables */
            await this.retryService.retry({
                action: async () => {
                    await this.courseInsertService.insert(course)
                },
            })

            /** 2. Upsert module-level tables */
            const modules = (course.modules ?? []) as Array<DeepPartial<ModuleEntity>>
            for (const module of modules) {
                await this.retryService.retry({
                    action: async () => {
                        await this.moduleInsertService.insert(module)
                    },
                })

                /** 3. Upsert content-level tables */
                const moduleId = module.id as string
                const contents = (module.contents ?? []) as Array<DeepPartial<ContentEntity>>
                for (const content of contents) {
                    const contentId = content.id as string
                    /** Inject FK relation so TypeORM populates the module_id column */
                    content.module = {
                        id: moduleId 
                    }
                    await this.retryService.retry({
                        action: async () => {
                            await this.contentInsertService.insert(content)
                        },
                    })
                    /** 4. Upsert challenges */
                    const challenges = (content.challenges ?? []) as Array<DeepPartial<ChallengeEntity>>
                    for (const challenge of challenges) {
                        await this.retryService.retry({
                            action: async () => {
                                await this.challengeInsertService.insert(challenge)
                            },
                        })
                    }
                    /** Delete stale challenges */
                    await this.retryService.retry({
                        action: async () => {
                            await this.challengeInsertService.deleteStale(
                                challenges.map((challenge) => challenge.id as string),
                                contentId,
                            )
                        },
                    })

                    /** 5. Upsert lesson videos */
                    const lessons = (content.lessons ?? []) as Array<DeepPartial<LessonVideoEntity>>
                    for (const lesson of lessons) {
                        await this.retryService.retry({
                            action: async () => {
                                await this.lessonVideoInsertService.insert(lesson)
                            },
                        })
                    }
                    /** Delete stale lesson videos */
                    await this.retryService.retry({
                        action: async () => {
                            await this.lessonVideoInsertService.deleteStale(
                                lessons.map((lesson) => lesson.id as string),
                                contentId,
                            )
                        },
                    })
                }
                /** Delete stale contents */
                await this.retryService.retry({
                    action: async () => {
                        await this.contentInsertService.deleteStale(
                            contents.map((content) => content.id as string),
                            module.id as string,
                        )
                    },
                })
            }
            /** Delete stale modules */
            await this.retryService.retry({
                action: async () => {
                    await this.moduleInsertService.deleteStale(
                        modules.map((module) => module.id as string),
                        courseId,
                    )
                },
            })

            /** 6. Upsert milestones */
            const courseResult = courseResults.find(
                (cr) => cr.data.id === courseId,
            )
            const milestoneResults = await this.milestoneParserService.parseMany(
                {
                    courseRelativePath: courseResult?.relativePath ?? "",
                    courseIndex: courseResult?.index ?? 0,
                },
            )
            for (const milestoneResult of milestoneResults) {
                const milestone = milestoneResult.data
                const milestoneId = milestone.id as string

                /** Inject FK */
                milestone.course = {
                    id: courseId 
                }

                await this.retryService.retry({
                    action: async () => {
                        await this.milestoneInsertService.insert(milestone)
                    },
                })

                /** 7. Upsert milestone tasks */
                const taskResults = await this.milestoneTaskParserService.parseMany(
                    {
                        milestoneRelativePath: milestoneResult.relativePath,
                        courseIndex: courseResult?.index ?? 0,
                        milestoneIndex: milestoneResult.index,
                    },
                )
                const tasks: Array<DeepPartial<MilestoneTaskEntity>> = []
                for (const taskResult of taskResults) {
                    const task = taskResult.data
                    /** Inject FK */
                    task.milestone = {
                        id: milestoneId 
                    } as any
                    tasks.push(task)

                    await this.retryService.retry({
                        action: async () => {
                            await this.milestoneTaskInsertService.insert(task)
                        },
                    })
                }
                /** Delete stale tasks */
                await this.retryService.retry({
                    action: async () => {
                        await this.milestoneTaskInsertService.deleteStale(
                            tasks.map((t) => t.id as string),
                            milestoneId,
                        )
                    },
                })
            }
            /** Delete stale milestones */
            await this.retryService.retry({
                action: async () => {
                    await this.milestoneInsertService.deleteStale(
                        milestoneResults.map((m) => m.data.id as string),
                        courseId,
                    )
                },
            })
        }
    }
}
