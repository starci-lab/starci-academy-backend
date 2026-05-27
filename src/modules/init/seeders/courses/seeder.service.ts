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
    MilestoneEntity,
    ModuleEntity,
    MilestoneTaskEntity,
} from "@modules/databases"
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
import {
    MilestonePathService,
    ModulePathService,
} from "./path"
import {
    resolveCourseSeedScope,
} from "../shared/scope"
import {
    ResolvedFileResult,
    logInitSeederEntitySkipped,
} from "../shared"
import {
    shouldIncludeCourseModule,
    shouldIncludeCourseMilestone,
} from "../../utils"
import {
    WinstonService,
} from "@modules/winston"

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
        private readonly modulePathService: ModulePathService,
        private readonly milestonePathService: MilestonePathService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Parse course markdown/S3 sources and upsert PostgreSQL (courses → modules → … → milestones).
     * Scope from `envConfig().init` seeders `courses` via {@link resolveCourseSeedScope}.
     */
    async seed(): Promise<void> {
        const {
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
        } = resolveCourseSeedScope()
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
            const courseDisplayId = courseResult.data.displayId as string
            /** The modules to seed. */
            const modules: Array<DeepPartial<ModuleEntity>> = []
            const modulePaths = await this.modulePathService.paths({
                courseRelativePath: courseResult.relativePath,
            })
            const moduleResults: Array<ResolvedFileResult<DeepPartial<ModuleEntity>>> = []
            for (const path of modulePaths) {
                if (
                    !shouldIncludeCourseModule(
                        moduleIndexFilterByDisplayId,
                        courseDisplayId,
                        path.orderIndex,
                    )
                ) {
                    continue
                }
                try {
                    const module = await this.moduleParserService.parse({
                        paths: modulePaths,
                        moduleIndex: path.orderIndex,
                        courseIndex: courseResult.index,
                    })
                    moduleResults.push({
                        data: module,
                        index: path.orderIndex,
                        relativePath: path.relativePath,
                    })
                } catch (error) {
                    logInitSeederEntitySkipped(
                        this.winstonService,
                        ModuleEntity,
                        path.relativePath,
                        error,
                    )
                }
            }
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
            const courseDisplayId = course.displayId as string

            /** 1. Upsert course-level tables */
            await this.courseInsertService.insert(course)

            /** 2. Upsert module-level tables */
            const modules = (course.modules ?? []) as Array<DeepPartial<ModuleEntity>>
            for (const module of modules) {
                await this.moduleInsertService.insert(module)

                /** 3. Upsert content-level tables */
                const moduleId = module.id as string
                const contents = (module.contents ?? []) as Array<DeepPartial<ContentEntity>>
                for (const content of contents) {
                    const contentId = content.id as string
                    /** Inject FK relation so TypeORM populates the module_id column */
                    content.module = {
                        id: moduleId 
                    }
                    await this.contentInsertService.insert(content)
                    /** 4. Upsert challenges */
                    const challenges = (content.challenges ?? []) as Array<DeepPartial<ChallengeEntity>>
                    for (const challenge of challenges) {
                        await this.challengeInsertService.insert(challenge)
                    }
                    // /** Delete stale challenges */
                    // await this.challengeInsertService.deleteStale(
                    //     challenges.map((challenge) => challenge.id as string),
                    //     contentId,
                    // )
                    /** 5. Upsert lesson videos */
                    const lessons = (content.lessons ?? []) as Array<DeepPartial<LessonVideoEntity>>
                    for (const lesson of lessons) {
                        await this.lessonVideoInsertService.insert(lesson)
                    }
                    // /** Delete stale lesson videos */
                    // await this.lessonVideoInsertService.deleteStale(
                    //     lessons.map((lesson) => lesson.id as string),
                    //     contentId,
                    // )
                }
                // /** Delete stale contents */
                // await this.contentInsertService.deleteStale(
                //     contents.map((content) => content.id as string),
                //             module.id as string,
                // )
            }
            // /** Drop modules for this course that are not in the current seed batch (e.g. only order 0,1). */
            // await this.moduleInsertService.deleteStale(
            //     modules.map((module) => module.id as string),
            //     courseId,
            // )

            /** 6. Upsert milestones */
            const courseResult = courseResults.find(
                (cr) => cr.data.id === courseId,
            )
            const milestoneRelativePath = courseResult?.relativePath ?? ""
            const milestonePaths = await this.milestonePathService.paths({
                courseRelativePath: milestoneRelativePath,
            })
            const milestoneResults: Array<ResolvedFileResult<DeepPartial<MilestoneEntity>>> = []
            for (const path of milestonePaths) {
                if (
                    !shouldIncludeCourseMilestone(
                        milestoneIndexFilterByDisplayId,
                        courseDisplayId,
                        path.orderIndex,
                    )
                ) {
                    continue
                }
                try {
                    const milestone = await this.milestoneParserService.parse({
                        paths: milestonePaths,
                        courseIndex: courseResult?.index ?? 0,
                        milestoneIndex: path.orderIndex,
                    })
                    milestoneResults.push({
                        data: milestone,
                        index: path.orderIndex,
                        relativePath: path.relativePath,
                    })
                } catch (error) {
                    logInitSeederEntitySkipped(
                        this.winstonService,
                        MilestoneEntity,
                        path.relativePath,
                        error,
                    )
                }
            }
            for (const milestoneResult of milestoneResults) {
                const milestone = milestoneResult.data
                const milestoneId = milestone.id as string

                /** Inject FK */
                milestone.course = {
                    id: courseId 
                }

                await this.milestoneInsertService.insert(milestone)

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

                    await this.milestoneTaskInsertService.insert(task)
                }
                // /** Delete stale tasks */
                // await this.milestoneTaskInsertService.deleteStale(
                //     tasks.map((t) => t.id as string),
                //     milestoneId,
                // )
            }
            // /** Drop milestones for this course not in the current seed batch. */
            // await this.milestoneInsertService.deleteStale(
            //     milestoneResults.map((m) => m.data.id as string),
            //     courseId,
            // )
        }
    }
}
