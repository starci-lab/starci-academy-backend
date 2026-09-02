import type {
    AppConfigProSubscription,
} from "@modules/filesystem/types/config"
import {
    Injectable,
} from "@nestjs/common"
import {
    ContextLoaderService,
} from "../../shared/contexts/loader.service"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import {
    LearnerPlanCatalogPathService,
} from "../path/learner-plan-catalog.path"
import type {
    LearnerPlanCatalogMd,
} from "./types"

@Injectable()
/** Parses the single dedicated Pro learner plan from the data gitmount. */
export class LearnerPlanCatalogParserService {
    constructor(
        private readonly learnerPlanCatalogPathService: LearnerPlanCatalogPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
    ) {}

    async parseOne(): Promise<AppConfigProSubscription | null> {
        const entry = (await this.learnerPlanCatalogPathService.paths())[0]
        if (!entry) {
            return null
        }
        const raw = await this.contextLoaderService.load(
            "learner-plans",
            `${entry.relativePath}/en.md`,
        )
        const md = this.extractJsonFromMdService.extract<LearnerPlanCatalogMd>(raw)
        const row: AppConfigProSubscription = {
            planId: "pro",
            displayName: this.coerceMdScalarService.toRequiredString(md.displayName,
                "StarCi Pro"),
            description: this.coerceMdScalarService.toRequiredString(md.description,
                ""),
            priceVnd: this.coerceMdScalarService.toRequiredNumber(md.priceVnd,
                0),
            billingPeriodMonths: 1,
            offerRevision: this.coerceMdScalarService.toRequiredString(md.offerRevision,
                ""),
            creditsPer5h: this.coerceMdScalarService.toRequiredNumber(md.creditsPer5h,
                0),
            creditsPerWeek: this.coerceMdScalarService.toRequiredNumber(md.creditsPerWeek,
                0),
            enabled: this.coerceMdScalarService.toRequiredBoolean(md.enabled,
                true),
        }
        return row.priceVnd > 0 && row.offerRevision ? row : null
    }
}
