import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    HeadhuntingCompanyEntity,
    HeadhuntingCompanyTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "../../shared"

@Injectable()
/**
 * Upserts one headhunting company + `headhunting_company_translations`. Child
 * consultants are NOT written here -- {@link ConsultantInsertService} runs after
 * the company row exists so the FK is valid.
 */
export class HeadhuntingCompanyInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) {}

    async insert(
        company: DeepPartial<HeadhuntingCompanyEntity>,
    ): Promise<void> {
        const companyId = company.id as string
        const {
            translations,
            consultants,
            ...rest
        } = company
        await this.upsertService.upsertMany(
            HeadhuntingCompanyEntity,
            [rest],
        )
        if (translations) {
            await this.upsertService.upsertTranslationMany(
                HeadhuntingCompanyTranslationEntity,
                translations,
                {
                    companyId,
                },
            )
        }
    }
}
