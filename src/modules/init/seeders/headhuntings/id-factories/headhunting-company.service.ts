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
/**
 * Root headhunting-company UUIDs keyed by mount folder ordinal. Consultants
 * chain from this id; namespace is `uuidNamespace.headhunting` so they never
 * collide with course ids.
 */
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
