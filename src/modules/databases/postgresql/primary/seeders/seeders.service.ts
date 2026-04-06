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
    EntityManager 
} from "typeorm"
import {
    CourseParserService,
    CoursesUpdaterService,
    CourseDirService
} from "./courses"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "../primary.decorators"
import {
    CourseEntity 
} from "@modules/databases"

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
        private readonly coursesUpdaterService: CoursesUpdaterService,
        private readonly courseParserService: CourseParserService,
        private readonly courseDirService: CourseDirService,
    ) { }

    /**
     * Process the seeding and dropping.
     * @returns void.
     */
    private async process() {
        // seed in a transaction (do not drop: prevents cascade deletes like enrollments)
        await this.entityManager.transaction(
            async (entityManager) => {
                const previousCourses = await entityManager.find(CourseEntity)
                const courseMounts = this.courseDirService.indexes()
                const updatedCourses = courseMounts.map((courseIndex) => {
                    return this.courseParserService.parse(
                        {
                            courseIndex,
                        },
                    )
                })
                await this.coursesUpdaterService.updateCourses(
                    {
                        previous: previousCourses,
                        updated: updatedCourses as Array<CourseEntity>,
                        entityManager,
                    }
                )
            }
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