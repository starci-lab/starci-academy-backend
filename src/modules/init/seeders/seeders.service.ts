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
/**
 * Init seed orchestrator: each domain seeder reads `envConfig().init` seeders context itself.
 */
@Injectable()
export class SeedersService {
    constructor(
        private readonly courseSeederService: CourseSeederService,
        private readonly cvSeederService: CvSeederService,
        private readonly foundationSeederService: FoundationSeederService,
        private readonly headhunterSeederService: HeadhuntingSeederService,
        private readonly catalogSeederService: CatalogSeederService,
    ) { }

    /** Runs all init seed pipelines sequentially (env gates live inside each seeder). */
    async init() {
        await this.catalogSeederService.seed()
        await this.courseSeederService.seed()
        await this.cvSeederService.seed()
        await this.foundationSeederService.seed()
        await this.headhunterSeederService.seed()
    }
}
