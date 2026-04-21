import {
    Inject, Injectable, OnModuleInit
} from "@nestjs/common"
import {
    ReadinessWatcherFactoryService,
} from "@modules/mixin"
import {
    MODULE_OPTIONS_TOKEN, OPTIONS_TYPE
} from "./seeders.module-definition"
import {
    DeepPartial,
    EntityManager
} from "typeorm"
import {
    CourseParserService,
    CourseDirService,
    ModuleDirService,
    ModuleParserService,
    ChallengeParserService,
    ChallengeDirService,
    LessonVideoDirService,
    LessonVideoParserService,
    ContentDirService,
    ContentParserService,
} from "./courses"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "../primary.decorators"
import {
    CourseEntity,
    ModuleEntity
} from "../entities"
/**
 * The service for the Seeders.
 */
@Injectable()
export class SeedersService implements OnModuleInit {
    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: typeof OPTIONS_TYPE,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
        private readonly courseParserService: CourseParserService,
        private readonly courseDirService: CourseDirService,
        private readonly moduleDirService: ModuleDirService,
        private readonly moduleParserService: ModuleParserService,
        private readonly challengeParserService: ChallengeParserService,
        private readonly challengeDirService: ChallengeDirService,
        private readonly lessonVideoDirService: LessonVideoDirService,
        private readonly lessonVideoParserService: LessonVideoParserService,
        private readonly contentDirService: ContentDirService,
        private readonly contentParserService: ContentParserService,
    ) { }

    /**
     * Process the seeding and dropping.
     * @returns void.
     */
    private async process() {
        const courseMounts = this.courseDirService.indexes()
        const updatedCourses: Array<DeepPartial<CourseEntity>> = courseMounts.map((courseIndex) => {
            const course = this.courseParserService.parse(
                {
                    courseIndex,
                },
            )
            const moduleMounts = this.moduleDirService.indexes({
                courseIndex,
            })
            const updatedModules: Array<DeepPartial<ModuleEntity>> = moduleMounts.map(
                (moduleIndex) => {
                    const module = this.moduleParserService.parse(
                        {
                            courseIndex,
                            moduleIndex,
                        },
                    )
                    const contents = (() => {
                        const contentMounts = this.contentDirService.indexes(
                            {
                                courseIndex,
                                moduleIndex,
                            }
                        )
                        return contentMounts.map(
                            (contentIndex) => this.contentParserService.parse(
                                {
                                    courseIndex,
                                    moduleIndex,
                                    contentIndex,
                                },
                            )
                        )
                    })()
                    return {
                        ...module,
                        contents,
                        numContents: contents.length,
                    }
                }
            )
            return {
                ...course,
                modules: updatedModules,
            }
        })
        await this.entityManager.save(
            CourseEntity,
            updatedCourses
        )
    }

    /**
     * On module init.
     * @returns void.
     */
    async onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(SeedersService.name)
        // if manual seed, do not seed
        if (this.options.manualSeed) {
            return
        }
        await this.process()
        this.readinessWatcherFactoryService.setReady(SeedersService.name)
    }

    /**
     * Seed the data.
     * @returns void.
     */
    async seed() {
        await this.process()
    }
}