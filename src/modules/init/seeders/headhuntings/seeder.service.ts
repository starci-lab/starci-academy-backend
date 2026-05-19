import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    HeadhuntingCompanyEntity,
    ConsultantEntity,
} from "@modules/databases"
import {
    RetryService,
} from "@modules/mixin"
import {
    HeadhuntingCompanyInsertService,
    ConsultantInsertService,
} from "./inserts"
import {
    HeadhuntingCompanyParserService,
    ConsultantParserService,
} from "./parsers"

/**
 * Parse headhuntings mount data and upsert PostgreSQL (companies → consultants).
 */
@Injectable()
export class HeadhuntingSeederService {
    constructor(
        private readonly headhuntingCompanyParserService: HeadhuntingCompanyParserService,
        private readonly consultantParserService: ConsultantParserService,
        private readonly headhuntingCompanyInsertService: HeadhuntingCompanyInsertService,
        private readonly consultantInsertService: ConsultantInsertService,
        private readonly retryService: RetryService,
    ) {}

    async seed(): Promise<void> {
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

            await this.retryService.retry({
                action: async () => {
                    await this.headhuntingCompanyInsertService.insert(company)
                },
            })

            const consultants = (company.consultants ?? []) as Array<DeepPartial<ConsultantEntity>>
            for (const consultant of consultants) {
                consultant.company = {
                    id: companyId,
                }
                await this.retryService.retry({
                    action: async () => {
                        await this.consultantInsertService.insert(consultant)
                    },
                })
            }

            await this.retryService.retry({
                action: async () => {
                    await this.consultantInsertService.deleteStale(
                        consultants.map((entry) => entry.id as string),
                        companyId,
                    )
                },
            })
        }
    }
}
