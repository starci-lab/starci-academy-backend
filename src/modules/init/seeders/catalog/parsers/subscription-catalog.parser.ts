import {
    Injectable,
} from "@nestjs/common"
import type {
    AppConfigSubscriptionTier,
} from "@modules/filesystem"
import {
    AiSubTier,
} from "@modules/databases"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    SubscriptionCatalogPathService,
} from "../path"
import {
    WinstonService,
} from "@modules/winston"

/** Log label for skipped mount rows (no DB entity). */
class SubscriptionCatalogEntity {
    static readonly name = "SubscriptionCatalog"
}

/** Mount markdown shape for `.mount/data/subcriptions/<index>-<tier>/en.md`. */
type SubscriptionCatalogMd = {
    tier?: string
    displayName?: string
    priceVnd?: string | number
    creditsPer5h?: string | number
    creditsPerWeek?: string | number
    popular?: string | boolean
    enabled?: string | boolean
    [key: string]: unknown
}

/**
 * Parses `.mount/data/subcriptions/<index>-<tier>/{en,vi}.md` into catalog rows
 * (same mount markdown convention as courses / ai-models).
 */
@Injectable()
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
                    SubscriptionCatalogEntity,
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
                priceVnd: this.coerceMdScalarService.toRequiredNumber(
                    md.priceVnd,
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
                    SubscriptionCatalogEntity,
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
