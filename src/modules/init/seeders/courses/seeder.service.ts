import {
    Injectable,
} from "@nestjs/common"
import {
    CourseParserService,
} from "./parsers"
import {
    SeedScopeService,
} from "../../scope"
import {
    CourseProcessorService,
} from "./processors/course-processor.service"

/**
 * Course init seeder entry: scope checks, parse courses, delegate to {@link CourseProcessorService}.
 */
@Injectable()
export class CourseSeederService {
    constructor(
        private readonly courseParserService: CourseParserService,
        private readonly courseProcessorService: CourseProcessorService,
        private readonly seedScopeService: SeedScopeService,
    ) { }

    /**
     * Parse course markdown/S3 sources and upsert PostgreSQL (courses → modules → … → milestones).
     * Scope from `seed.yaml` seeders `courses` via {@link SeedScopeService}.
     */
    async seed(): Promise<void> {
        if (!this.seedScopeService.isCoursesSeederEnabled()) {
            return
        }
        const quizEnabled = this.seedScopeService.isCoursesQuizSeederEnabled()
        const quizLinkContents = this.seedScopeService.isCoursesQuizLinkContentsEnabled()
        const {
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
        } = this.seedScopeService.resolveCourseSeedScope()
        const courseResults = await this.courseParserService.parseMany()
        await this.courseProcessorService.process({
            courseResults,
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
            quizEnabled,
            quizLinkContents,
        })
    }
}
