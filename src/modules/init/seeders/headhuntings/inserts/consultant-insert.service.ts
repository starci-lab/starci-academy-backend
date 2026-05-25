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
} from "../../courses"

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
        await this.upsertService.upsertUuid(
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
            await this.upsertService.upsertTranslation(
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
        await this.upsertService.deleteStaleUuid<ConsultantEntity>(
            ConsultantEntity,
            ids,
            {
                company: {
                    id: companyId 
                },
            },
        )
    }
}
