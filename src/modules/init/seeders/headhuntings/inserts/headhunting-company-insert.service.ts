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
} from "../../courses"

@Injectable()
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
        await this.upsertService.upsertUuid(
            HeadhuntingCompanyEntity,
            [rest],
        )
        if (translations) {
            await this.upsertService.upsertTranslation(
                HeadhuntingCompanyTranslationEntity,
                translations,
                {
                    companyId,
                },
            )
        }
    }
}
