import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    TemplateCVEntity,
} from "@modules/databases"

/**
 * Persists parsed CV rubric templates (`template_cvs` + translations).
 */
@Injectable()
export class TemplateCvInsertService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Upsert/save all template rows in one batch (cascade translations).
     */
    async saveAll(
        templates: Array<DeepPartial<TemplateCVEntity>>,
    ): Promise<void> {
        if (templates.length === 0) {
            return
        }
        await this.entityManager.save(
            TemplateCVEntity,
            templates,
        )
    }
}
