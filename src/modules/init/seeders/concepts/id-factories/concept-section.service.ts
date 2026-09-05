import {
    Injectable,
} from "@nestjs/common"
import {
    v5 as uuidv5,
} from "uuid"
import {
    ConceptIdFactoryService,
} from "./concept.service"

@Injectable()
/** Generates a stable section UUID from the owning concept and section slugs. */
export class ConceptSectionIdFactoryService {
    constructor(
        private readonly conceptIdFactoryService: ConceptIdFactoryService,
    ) {}

    generate(conceptDisplayId: string, sectionDisplayId: string): string {
        return uuidv5(
            `concept-section:${sectionDisplayId}`,
            this.conceptIdFactoryService.generate(conceptDisplayId),
        )
    }
}
