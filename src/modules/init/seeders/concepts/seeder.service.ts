import {
    Injectable,
} from "@nestjs/common"
import {
    ConceptInsertService,
} from "./insert.service"
import {
    ConceptParserService,
} from "./parser.service"

@Injectable()
/** Runs the independent Concepts V1 parse and persistence pipeline. */
export class ConceptSeederService {
    constructor(
        private readonly conceptParserService: ConceptParserService,
        private readonly conceptInsertService: ConceptInsertService,
    ) {}

    async seed(): Promise<void> {
        const parsed = await this.conceptParserService.parseMany()
        if (parsed.length === 0) {
            return
        }
        await this.conceptInsertService.insertAll(
            parsed.map((result) => result.concept),
        )
    }
}
