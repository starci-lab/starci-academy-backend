import {
    Injectable,
} from "@nestjs/common"
import {
    TemplateCvInsertService,
} from "./inserts"
import {
    TemplateCvParserService,
} from "./parsers"
import {
    SeedScopeService,
} from "../../scope"

/**
 * CV mount seeder: parse mount markdown → upsert `template_cvs` (same orchestration role as {@link CourseSeederService} for courses).
 */
@Injectable()
export class CvSeederService {
    constructor(
        private readonly templateCvParserService: TemplateCvParserService,
        private readonly templateCvInsertService: TemplateCvInsertService,
        private readonly seedScopeService: SeedScopeService,
    ) { }

    /**
     * Reads mount CV markdown and upserts template rows. No-op if the mount path is missing.
     */
    async seed(): Promise<void> {
        if (!this.seedScopeService.isCvSeederEnabled()) {
            return
        }
        const templateResults = await this.templateCvParserService.parseMany()
        const templates = templateResults.map(
            (result) => result.data,
        )
        for (const template of templates) {
            await this.templateCvInsertService.insert(template)
        }
    }
}
