import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
    EntityManager
} from "typeorm"
import {
    CourseParserService,
    ModuleParserService,
    ChallengeParserService,
    LessonVideoParserService,
    ContentParserService,
} from "./courses"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
    ModuleEntity,
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases"
import {
    RetryService
} from "@modules/mixin"
/**
 * The service for the Seeders.
 * Parses course data from the filesystem/S3 and saves to PostgreSQL.
 */
@Injectable()
export class SeedersService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseParserService: CourseParserService,
        private readonly moduleParserService: ModuleParserService,
        private readonly challengeParserService: ChallengeParserService,
        private readonly lessonVideoParserService: LessonVideoParserService,
        private readonly contentParserService: ContentParserService,
        private readonly retryService: RetryService,
    ) { }

    /**
     * Initialize the seeders — parse and save all course data.
     * @returns void.
     */
    async init() {
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
        /** We save the courses to the database. */
        await this.retryService.retry({
            action: async () => {
                return await this.entityManager.save(
                    CourseEntity,
                    courses
                )
            },
        })
    }
}