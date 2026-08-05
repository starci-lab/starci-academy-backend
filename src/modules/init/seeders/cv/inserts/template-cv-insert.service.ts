import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    TemplateCVEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"

@Injectable()
/**
 * Persists parsed CV rubric templates (`template_cvs` + translations).
 */
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
