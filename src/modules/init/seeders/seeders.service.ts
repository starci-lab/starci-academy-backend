import {
    Injectable,
} from "@nestjs/common"
import {
    CourseSeederService,
} from "./courses"
import {
    CvSeederService,
} from "./cv"
import {
    FoundationSeederService,
} from "./foundations"
import {
    RetryService
} from "@modules/mixin"
/**
 * Init seed orchestrator: delegates course/milestone pipeline to {@link CourseSeederService},
 * then CV mount templates.
 */
@Injectable()
export class SeedersService {
    constructor(
        private readonly courseSeederService: CourseSeederService,
        private readonly retryService: RetryService,
        private readonly cvSeederService: CvSeederService,
        private readonly foundationSeederService: FoundationSeederService,
    ) { }

    /**
     * Initialize the seeders — parse and save all course data, then CV templates from mount.
     */
    async init() {
        await this.retryService.retry(
            {
                action: async () => {
                    await this.courseSeederService.seed()
                },
            }
        )
        await this.retryService.retry(
            {
                action: async () => {
                    await this.cvSeederService.seed()
                },
            }
        )
        await this.retryService.retry(
            {
                action: async () => {
                    await this.foundationSeederService.seed()
                },
            }
        )
    }
}
