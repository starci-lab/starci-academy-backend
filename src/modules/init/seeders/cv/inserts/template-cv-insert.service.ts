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
     * Insert a single CV template row (cascade translations).
     */
    async insert(
        template: DeepPartial<TemplateCVEntity>,
    ): Promise<void> {
        await this.entityManager.save(
            TemplateCVEntity,
            template
        )
    }
}
