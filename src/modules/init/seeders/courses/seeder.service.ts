import {
    Injectable,
} from "@nestjs/common"
import {
    CourseParserService,
} from "./parsers"
import {
    resolveCourseSeedScope,
    isCoursesSeederEnabled,
    isCoursesQuizLinkContentsEnabled,
    isCoursesQuizSeederEnabled,
} from "../shared/scope"
import {
    CourseProcessorService,
} from "./processors"

/**
 * Course init seeder entry: scope checks, parse courses, delegate to {@link CourseProcessorService}.
 */
@Injectable()
export class CourseSeederService {
    constructor(
        private readonly courseParserService: CourseParserService,
        private readonly courseProcessorService: CourseProcessorService,
    ) { }

    /**
     * Parse course markdown/S3 sources and upsert PostgreSQL (courses → modules → … → milestones).
     * Scope from envConfig().init seeders `courses` via {@link resolveCourseSeedScope}.
     */
    async seed(): Promise<void> {
        if (!isCoursesSeederEnabled()) {
            return
        }
        const quizEnabled = isCoursesQuizSeederEnabled()
        const quizLinkContents = isCoursesQuizLinkContentsEnabled()
        const {
            moduleIndexFilterByDisplayId,
            milestoneIndexFilterByDisplayId,
        } = resolveCourseSeedScope()
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
