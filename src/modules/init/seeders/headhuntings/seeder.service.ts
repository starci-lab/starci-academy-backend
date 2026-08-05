import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    ConsultantInsertService,
} from "./inserts/consultant-insert.service"
import {
    HeadhuntingCompanyInsertService,
} from "./inserts/headhunting-company-insert.service"
import {
    ConsultantParserService,
} from "./parsers/consultant.service"
import {
    HeadhuntingCompanyParserService,
} from "./parsers/headhunting-company.service"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"

@Injectable()
/**
 * Parse headhuntings mount data and upsert PostgreSQL (companies -> consultants).
 */
export class HeadhuntingSeederService {
    constructor(
        private readonly headhuntingCompanyParserService: HeadhuntingCompanyParserService,
        private readonly consultantParserService: ConsultantParserService,
        private readonly headhuntingCompanyInsertService: HeadhuntingCompanyInsertService,
        private readonly consultantInsertService: ConsultantInsertService,
        private readonly seedScopeService: SeedScopeService,
    ) {}

    async seed(): Promise<void> {
        if (!this.seedScopeService.isHeadhuntingSeederEnabled()) {
            return
        }
        const companies: Array<DeepPartial<HeadhuntingCompanyEntity>> = []
        const companyResults = await this.headhuntingCompanyParserService.parseMany()
        for (const companyResult of companyResults) {
            companies.push(companyResult.data)
        }

        for (const companyResult of companyResults) {
            const consultants: Array<DeepPartial<ConsultantEntity>> = []
            const consultantResults = await this.consultantParserService.parseMany({
                companyRelativePath: companyResult.relativePath,
                companyIndex: companyResult.index,
            })
            for (const consultantResult of consultantResults) {
                consultants.push(consultantResult.data)
            }

            const company = companies.find(
                (entry) => entry.id === companyResult.data.id,
            )
            if (company) {
                company.consultants = consultants
            }
        }

        for (const company of companies) {
            const companyId = company.id as string

            await this.headhuntingCompanyInsertService.insert(company)

            const consultants = (company.consultants ?? []) as Array<DeepPartial<ConsultantEntity>>
            for (const consultant of consultants) {
                consultant.company = {
                    id: companyId,
                }
                await this.consultantInsertService.insert(consultant)
            }
        }
    }
}
