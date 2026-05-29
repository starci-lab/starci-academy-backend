import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto"
import {
    envConfig,
} from "@modules/env"
import {
    HeadhuntingCompanyIdFactoryService,
} from "./headhunting-company.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateConsultantIdParams,
} from "./types"

/**
 * Builds deterministic headhunter UUIDs chained from the parent company ID.
 */
@Injectable()
export class ConsultantIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly headhuntingCompanyIdFactoryService: HeadhuntingCompanyIdFactoryService,
    ) {}

    generate(
        {
            companyIndex,
            consultantIndex,
        }: GenerateConsultantIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "consultant",
                this.headhuntingCompanyIdFactoryService.generate({
                    companyIndex,
                }),
                consultantIndex.toString(),
            ),
            envConfig().uuidNamespace.headhunting,
        )
    }
}
