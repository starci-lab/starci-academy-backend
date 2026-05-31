import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ConsultantEntity,
    ConsultantTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "../../shared"

@Injectable()
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
