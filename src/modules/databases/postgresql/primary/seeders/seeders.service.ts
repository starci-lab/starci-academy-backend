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
    CoursesService,
} from "./courses"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "../primary.decorators"

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
        private readonly coursesService: CoursesService,
    ) { }

    /**
     * Process the seeding and dropping.
     * @returns void.
     */
    private async process() {
        // drop and seed in a transaction
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.coursesService.drop(entityManager)
                await this.coursesService.seed(entityManager)
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