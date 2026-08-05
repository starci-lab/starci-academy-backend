import {
    Injectable,
} from "@nestjs/common"
import {
    CourseParserService,
} from "./parsers/course.service"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"
import {
    CourseProcessorService,
} from "./processors/course-processor.service"

@Injectable()
/**
 * Course init seeder entry: scope checks, parse courses, delegate to {@link CourseProcessorService}.
 */
export class CourseSeederService {
    constructor(
        private readonly courseParserService: CourseParserService,
        private readonly courseProcessorService: CourseProcessorService,
        private readonly seedScopeService: SeedScopeService,
    ) { }

    /**
     * Parse course markdown/S3 sources and upsert PostgreSQL (courses -> modules -> ... -> milestones).
     * Scope from `seed.yaml` seeders `courses` via {@link SeedScopeService}.
     */
    async seed(): Promise<void> {
        if (!this.seedScopeService.isCoursesSeederEnabled()) {
            return
        }
        const flashcardEnabled = this.seedScopeService.isCoursesFlashcardSeederEnabled()
        const {
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
        } = this.seedScopeService.resolveCourseSeedScope()
        const courseResults = await this.courseParserService.parseMany()
        await this.courseProcessorService.process({
            courseResults,
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
            flashcardEnabled,
        })
    }
}
