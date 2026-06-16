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
    HeadhuntingSeederService,
} from "./headhuntings"
import {
    CatalogSeederService,
} from "./catalog"
import {
    CodingProblemSeederService,
} from "./coding-problems"
import {
    AdvertisementSeederService,
} from "./advertisements"
import {
    ChangelogSeederService,
} from "./changelog"
import {
    BlogSeederService,
} from "./blog"
import {
    AchievementSeederService,
} from "./achievements"
/**
 * Init seed orchestrator: each domain seeder reads envConfig().init seeders context itself.
 */
@Injectable()
export class SeedersService {
    constructor(
        private readonly courseSeederService: CourseSeederService,
        private readonly cvSeederService: CvSeederService,
        private readonly foundationSeederService: FoundationSeederService,
        private readonly headhunterSeederService: HeadhuntingSeederService,
        private readonly catalogSeederService: CatalogSeederService,
        private readonly codingProblemSeederService: CodingProblemSeederService,
        private readonly advertisementSeederService: AdvertisementSeederService,
        private readonly changelogSeederService: ChangelogSeederService,
        private readonly blogSeederService: BlogSeederService,
        private readonly achievementSeederService: AchievementSeederService,
    ) { }

    /** Runs all init seed pipelines sequentially (env gates live inside each seeder). */
    async init() {
        await this.catalogSeederService.seed()
        await this.courseSeederService.seed()
        await this.cvSeederService.seed()
        await this.foundationSeederService.seed()
        await this.headhunterSeederService.seed()
        await this.codingProblemSeederService.seed()
        await this.advertisementSeederService.seed()
        await this.changelogSeederService.seed()
        await this.blogSeederService.seed()
        await this.achievementSeederService.seed()
    }
}
