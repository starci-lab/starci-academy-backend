import {
    Injectable,
} from "@nestjs/common"
import type {
    AppConfigSubscriptionTier,
} from "@modules/filesystem/types/config"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
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
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    SubscriptionCatalogPathService,
} from "../path/subscription-catalog.path"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    SubscriptionCatalogMd,
} from "./types"
import {
    SUBSCRIPTION_CATALOG_ENTITY,
} from "./constants"

@Injectable()
/**
 * Parses `.mount/data/subcriptions/<index>-<tier>/{en,vi}.md` into catalog rows
 * (same mount markdown convention as courses / ai-models).
 */
export class SubscriptionCatalogParserService {
    constructor(
        private readonly subscriptionCatalogPathService: SubscriptionCatalogPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly winstonService: WinstonService,
    ) {}

    /** Loads all indexed subscription tiers; empty when mount folder has no entries. */
    async parseMany(): Promise<Array<AppConfigSubscriptionTier>> {
        const paths = await this.subscriptionCatalogPathService.paths()
        const tiers: Array<AppConfigSubscriptionTier> = []

        for (const entry of paths) {
            const enRelativePath = `${entry.relativePath}/en.md`
            let raw: string
            try {
                raw = await this.contextLoaderService.load(
                    "subcriptions",
                    enRelativePath,
                )
            } catch {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    SUBSCRIPTION_CATALOG_ENTITY,
                    enRelativePath,
                    new Error("en.md missing or unreadable"),
                )
                continue
            }

            const md = this.extractJsonFromMdService.extract<SubscriptionCatalogMd>(raw)
            const tierValue = this.coerceMdScalarService.toRequiredEnum(
                md.tier,
                AiSubTier,
                entry.displayId as AiSubTier,
            )
            const row: AppConfigSubscriptionTier = {
                tier: tierValue,
                displayName: this.coerceMdScalarService.toNullableString(md.displayName),
                // audience/purpose tagline for the tier card (empty string when absent)
                description: this.coerceMdScalarService.toRequiredString(
                    md.description,
                    "",
                ),
                priceVnd: this.coerceMdScalarService.toRequiredNumber(
                    md.priceVnd,
                    0,
                ),
                // USD dollar price for international gateways (defaults to 0 when unset)
                priceUsd: this.coerceMdScalarService.toRequiredNumber(
                    md.priceUsd,
                    0,
                ),
                creditsPer5h: this.coerceMdScalarService.toRequiredNumber(
                    md.creditsPer5h,
                    0,
                ),
                creditsPerWeek: this.coerceMdScalarService.toRequiredNumber(
                    md.creditsPerWeek,
                    0,
                ),
                popular: this.coerceMdScalarService.toNullableBoolean(md.popular),
                enabled: this.coerceMdScalarService.toRequiredBoolean(
                    md.enabled,
                    true,
                ),
            }

            if (!isValidSubscriptionTier(row)) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    SUBSCRIPTION_CATALOG_ENTITY,
                    enRelativePath,
                    new Error("invalid subscription en.md shape"),
                )
                continue
            }

            tiers.push(row)
        }

        const order = [
            AiSubTier.Plus,
            AiSubTier.Pro,
            AiSubTier.Max,
        ]
        return tiers.sort(
            (prev, next) => order.indexOf(prev.tier as AiSubTier)
                - order.indexOf(next.tier as AiSubTier),
        )
    }
}

const isValidSubscriptionTier = (
    row: AppConfigSubscriptionTier,
): boolean => {
    if (!row.tier || !Object.values(AiSubTier).includes(row.tier as AiSubTier)) {
        return false
    }
    if (Number.isNaN(row.priceVnd)) {
        return false
    }
    if (Number.isNaN(row.creditsPer5h)) {
        return false
    }
    if (Number.isNaN(row.creditsPerWeek)) {
        return false
    }
    return typeof row.enabled === "boolean"
}
