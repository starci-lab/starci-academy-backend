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
    QuizDeckEntity,
} from "@modules/databases"
import {
    ChallengeInsertService,
    ChallengeV2InsertService,
    ContentInsertService,
    CourseInsertService,
    LessonVideoInsertService,
    MilestoneInsertService,
    MilestoneTaskInsertService,
    MindMapInsertService,
    ModuleInsertService,
    QuizDeckInsertService,
} from "./inserts"
import {
    ChallengeParserService,
    ChallengeV2ParserService,
    ContentParserService,
    CourseParserService,
    LessonVideoParserService,
    MilestoneParserService,
    MilestoneTaskParserService,
    MindMapParserService,
    ModuleParserService,
    QuizDeckParserService,
} from "./parsers"
import {
    MilestonePathService,
    ModulePathService,
} from "./path"
import {
    resolveCourseSeedScope,
    isCoursesSeederEnabled,
    isCoursesQuizLinkContentsEnabled,
    isCoursesQuizSeederEnabled,
} from "../shared/scope"
import {
    ResolvedFileResult,
    logInitSeederEntitySkipped,
} from "../shared"
import {
    shouldIncludeCourseModule,
    shouldIncludeCourseMilestone,
    isRestrictedCourseTrackSeed,
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
        private readonly challengeV2ParserService: ChallengeV2ParserService,
        private readonly quizDeckParserService: QuizDeckParserService,
        private readonly lessonVideoParserService: LessonVideoParserService,
        private readonly contentParserService: ContentParserService,
        private readonly courseInsertService: CourseInsertService,
        private readonly moduleInsertService: ModuleInsertService,
        private readonly contentInsertService: ContentInsertService,
        private readonly lessonVideoInsertService: LessonVideoInsertService,
        private readonly challengeInsertService: ChallengeInsertService,
        private readonly challengeV2InsertService: ChallengeV2InsertService,
        private readonly quizDeckInsertService: QuizDeckInsertService,
        private readonly milestoneParserService: MilestoneParserService,
        private readonly milestoneTaskParserService: MilestoneTaskParserService,
        private readonly milestoneInsertService: MilestoneInsertService,
        private readonly milestoneTaskInsertService: MilestoneTaskInsertService,
        private readonly mindMapParserService: MindMapParserService,
        private readonly mindMapInsertService: MindMapInsertService,
        private readonly modulePathService: ModulePathService,
        private readonly milestonePathService: MilestonePathService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Parse course markdown/S3 sources and upsert PostgreSQL (courses → modules → … → milestones).
     * Scope from `envConfig().init` seeders `courses` via {@link resolveCourseSeedScope}.
     */
    async seed(): Promise<void> {
        // master gate: skip the entire course pipeline when disabled
        if (!isCoursesSeederEnabled()) {
            return
        }
        // whether course-level quiz decks should be parsed + upserted this run
        const quizEnabled = isCoursesQuizSeederEnabled()
        const quizLinkContents = isCoursesQuizLinkContentsEnabled()
        const {
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
        } = resolveCourseSeedScope()
        /** The courses to seed. */
        const courses: Array<DeepPartial<CourseEntity>> = []
        /**
         * Challenge ids detected as SCHEMA V2 (markdown carries `# approachCriteria`). The insert
         * phase routes these through {@link ChallengeV2InsertService}; everything else stays on the
         * legacy {@link ChallengeInsertService}. Tracking by id keeps both branches independent.
         */
        const v2ChallengeIds = new Set<string>()
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
            /** Content path → id map when `INIT_SEEDERS_COURSES_QUIZ_LINK_CONTENTS=true`. */
            const contentIdByPath = new Map<string, string>()
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
                    if (quizLinkContents) {
                        const moduleDisplayId = moduleResult.data.displayId as string
                        const contentDisplayId = contentResult.data.displayId as string
                        const contentId = contentResult.data.id as string
                        if (moduleDisplayId && contentDisplayId && contentId) {
                            contentIdByPath.set(
                                `${moduleDisplayId}/${contentDisplayId}`,
                                contentId,
                            )
                        }
                    }
                }

                /** Attach contents to the current module. */
                moduleResult.data.contents = contents

                /** We find challenges for each content. */
                for (const contentResult of contentResults) {
                    const challenges: Array<DeepPartial<ChallengeEntity>> = []
                    /**
                     * V2 parse pass first — it skips non-V2 files internally and returns only
                     * SCHEMA V2 graphs. Record their ids so the legacy pass can drop them.
                     */
                    const challengeV2Results = await this.challengeV2ParserService.parseMany(
                        {
                            contentRelativePath: contentResult.relativePath,
                            courseIndex: courseResult.index,
                            moduleIndex: moduleResult.index,
                            contentIndex: contentResult.index,
                        },
                    )
                    for (const challengeV2Result of challengeV2Results) {
                        const challengeV2Id = challengeV2Result.data.id as string
                        // mark this id so the insert phase routes it to the V2 insert service
                        v2ChallengeIds.add(challengeV2Id)
                        challenges.push(challengeV2Result.data)
                    }
                    /**
                     * Legacy parse pass — parses every file (incl. V2 ones in legacy shape), so we
                     * filter out any id already claimed by the V2 pass to avoid double handling.
                     */
                    const challengeResults = await this.challengeParserService.parseMany(
                        {
                            contentRelativePath: contentResult.relativePath,
                            courseIndex: courseResult.index,
                            moduleIndex: moduleResult.index,
                            contentIndex: contentResult.index,
                        },
                    )
                    for (const challengeResult of challengeResults) {
                        // skip V2-claimed ids — they are already in `challenges` in V2 shape
                        if (v2ChallengeIds.has(challengeResult.data.id as string)) {
                            continue
                        }
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
                /** Parse course-level quiz decks (own their course, optional N:N content links). */
                if (quizEnabled) {
                    const quizDecks: Array<DeepPartial<QuizDeckEntity>> = []
                    const quizDeckResults = await this.quizDeckParserService.parseMany(
                        {
                            courseRelativePath: courseResult.relativePath,
                            courseIndex: courseResult.index,
                            courseId: courseResult.data.id as string,
                            contentIdByPath,
                        },
                    )
                    for (const quizDeckResult of quizDeckResults) {
                        quizDecks.push(quizDeckResult.data)
                    }
                    course.quizDecks = quizDecks
                }
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
                    /** Inject FK relation so TypeORM populates the module_id column */
                    content.module = {
                        id: moduleId 
                    }
                    await this.contentInsertService.insert(content)
                    /** 4. Upsert challenges */
                    const challenges = (content.challenges ?? []) as Array<DeepPartial<ChallengeEntity>>
                    for (const challenge of challenges) {
                        // route V2-detected challenges to the additive V2 insert; rest stay legacy
                        if (v2ChallengeIds.has(challenge.id as string)) {
                            await this.challengeV2InsertService.insert(challenge)
                        } else {
                            await this.challengeInsertService.insert(challenge)
                        }
                    }
                    /** Delete stale challenges — scoped to THIS content (keeps only seeded ids). */
                    await this.challengeInsertService.deleteStale(
                        challenges.map((challenge) => challenge.id as string),
                        content.id as string,
                    )
                    /** 5. Upsert lesson videos */
                    const lessons = (content.lessons ?? []) as Array<DeepPartial<LessonVideoEntity>>
                    for (const lesson of lessons) {
                        await this.lessonVideoInsertService.insert(lesson)
                    }
                    /** Delete stale lesson videos — scoped to THIS content. */
                    await this.lessonVideoInsertService.deleteStale(
                        lessons.map((lesson) => lesson.id as string),
                        content.id as string,
                    )
                }
                /** Delete stale contents — scoped to THIS module (a seeded module). */
                await this.contentInsertService.deleteStale(
                    contents.map((content) => content.id as string),
                    module.id as string,
                )
            }
            /**
             * Delete stale modules — ONLY on a full (unrestricted) course rebuild. When the env
             * module filter scopes the seed to a subset (e.g. only fullstack module 0), `modules`
             * holds just that subset, so trimming would wipe every non-seeded module. The guard
             * keeps the scoped seed safe while still pruning removed modules on a full rebuild.
             */
            if (!isRestrictedCourseTrackSeed(moduleIndexFilterByDisplayId,
                courseDisplayId)) {
                await this.moduleInsertService.deleteStale(
                    modules.map((module) => module.id as string),
                    courseId,
                )
            }

            /** 5c. Upsert course-level quiz decks (after contents exist for N:N links). */
            const quizDecks = (course.quizDecks ?? []) as Array<DeepPartial<QuizDeckEntity>>
            for (const quizDeck of quizDecks) {
                await this.quizDeckInsertService.insert(quizDeck)
            }

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

            /** 8. Upsert mind-map (optional per course; modules must already be inserted for entityRef lookup). */
            const courseRelativePath = courseResult?.relativePath ?? ""
            try {
                const mindMapRoot = await this.mindMapParserService.parse({
                    courseRelativePath,
                })
                if (mindMapRoot) {
                    await this.mindMapInsertService.insert({
                        courseId,
                        root: mindMapRoot,
                    })
                }
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    CourseEntity,
                    `${courseRelativePath}/mind-map.yaml`,
                    error,
                )
            }
        }
    }
}
