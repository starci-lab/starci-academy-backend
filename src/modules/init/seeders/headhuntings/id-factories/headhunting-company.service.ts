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
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateHeadhuntingCompanyIdParams,
} from "./types"

@Injectable()
export class HeadhuntingCompanyIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
    ) {}

    generate(
        {
            companyIndex,
        }: GenerateHeadhuntingCompanyIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "headhunting-company",
                companyIndex.toString(),
            ),
            envConfig().uuidNamespace.headhunting,
        )
    }
}
