import {
    Injectable,
} from "@nestjs/common"
import {
    CourseSeederService,
} from "./courses/seeder.service"
import {
    CvSeederService,
} from "./cv/seeder.service"
import {
    FoundationSeederService,
} from "./foundations/seeder.service"
import {
    HeadhuntingSeederService,
} from "./headhuntings/seeder.service"
import {
    CatalogSeederService,
} from "./catalog/catalog-seeder.service"
import {
    CodingProblemSeederService,
} from "./coding-problems/coding-problem-seeder.service"
import {
    AdvertisementSeederService,
} from "./advertisements/advertisement-seeder.service"
import {
    ChangelogSeederService,
} from "./changelog/changelog-seeder.service"
import {
    BlogSeederService,
} from "./blog/blog-seeder.service"
import {
    AchievementSeederService,
} from "./achievements/achievement-seeder.service"
import {
    MockInterviewEqSeederService,
} from "./mock-interview-eq/mock-interview-eq-seeder.service"
@Injectable()
/**
 * Init seed orchestrator: each domain seeder reads envConfig().init seeders context itself.
 */
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
        private readonly mockInterviewEqSeederService: MockInterviewEqSeederService,
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
        await this.mockInterviewEqSeederService.seed()
    }
}
