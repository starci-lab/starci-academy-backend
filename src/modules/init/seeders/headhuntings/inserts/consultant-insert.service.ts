import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ConsultantTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/consultant-translation.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"

@Injectable()
/**
 * Upserts one consultant + `consultant_translations`. Nested `company` is
 * stripped after {@link HeadhuntingSeederService} sets the FK; `deleteStale`
 * prunes consultants removed from a company's mount so re-seed leaves no orphans.
 */
export class ConsultantInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) {}

    async insert(
        consultant: DeepPartial<ConsultantEntity>,
    ): Promise<void> {
        const consultantId = consultant.id as string
        const {
            translations,
            company,
            ...rest
        } = consultant
        await this.upsertService.upsertMany(
            ConsultantEntity,
            [{
                ...rest,
                ...(company ? {
                    company
                } : {
                }),
            }],
        )
        if (translations) {
            await this.upsertService.upsertTranslationMany(
                ConsultantTranslationEntity,
                translations,
                {
                    consultantId 
                },
            )
        }
    }

    async deleteStale(
        ids: Array<string>,
        companyId: string,
    ): Promise<void> {
        await this.upsertService.upsertMany<ConsultantEntity>(
            ConsultantEntity,
            ids.map((id) => ({
                id,
            }) as DeepPartial<ConsultantEntity>),
            {
                company: {
                    id: companyId,
                },
            },
        )
    }
}
