import {
    existsSync,
    readFileSync,
} from "fs"
import {
    join,
} from "path"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AchievementCriteriaType,
    AchievementEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem"
import {
    SeedScopeService,
} from "../../scope"
import {
    CoerceMdScalarService,
    ExtractJsonFromMdService,
} from "../shared"
import type {
    AchievementSeedFileRoot,
} from "./types"

@Injectable()
/**
 * Seeds achievement definitions from `achievements/achievements.md` (git-sourced
 * data root during init, else the local `.mount/data` fallback). The file uses the
 * mount markdown grammar (`# <n>` array items, `## field` object keys, `### en/vi`
 * for bilingual text); scalar leaves are coerced. Idempotent: each row is upserted
 * by its `slug`. Badge art ships in the data repo (`assets/badges/achievements/<slug>.png`)
 * and is synced to MinIO under the public `assets/` prefix (client renders + falls back).
 */
export class AchievementSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
    ) {}

    /**
     * Parse the achievements markdown and upsert each definition by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.achievements`)
        if (!this.seedScopeService.isAchievementsSeederEnabled()) {
            return
        }
        // resolve the markdown path (git snapshot root first, else local mount)
        const file = this.resolveFile()
        if (!file) {
            return
        }
        // extract the array root (`# 0`, `# 1`, ... -> wrapped as `{ data: [...] }`)
        const parsed = this.extractJsonFromMdService.extract<AchievementSeedFileRoot>(readFileSync(file,
            "utf8"))
        const items = parsed.data ?? []
        for (const item of items) {
            // a definition with no criteria type can't be evaluated -> skip it
            const criteriaType = this.coerceMdScalarService.toNullableEnum(
                item.criteriaType,
                AchievementCriteriaType,
            )
            if (!criteriaType) {
                continue
            }
            // stable slug drives both the upsert key and the badge art filename
            const slug = this.coerceMdScalarService.toRequiredString(item.slug,
                "")
            // upsert by the stable slug so re-seeding refreshes copy/thresholds
            await this.entityManager.upsert(
                AchievementEntity,
                {
                    slug,
                    name: item.name,
                    description: item.description,
                    criteriaType,
                    threshold: this.coerceMdScalarService.toRequiredNumber(item.threshold,
                        1),
                    tierThresholds: this.parseTierThresholds(item.tierThresholds),
                    // badge art ships in the data repo under assets/ and is synced to
                    // MinIO under the public assets/ prefix (client renders + falls back)
                    iconKey: `assets/badges/achievements/${slug}.png`,
                    sortIndex: this.coerceMdScalarService.toRequiredNumber(item.sortIndex,
                        0),
                },
                ["slug"],
            )
        }
    }

    /**
     * Parse the comma-separated tier-threshold string (`"10,25,50"`) into an
     * ascending number array, or null for a single-tier achievement.
     *
     * @param raw - the raw markdown scalar, or undefined.
     * @returns the parsed tier bars, or null when absent/empty.
     */
    private parseTierThresholds(raw?: string): Array<number> | null {
        // nothing authored -> single-tier achievement
        if (!raw) {
            return null
        }
        // split on commas, coerce each to a finite number, drop the rest
        const tiers = raw
            .split(",")
            .map((part) => Number(part.trim()))
            .filter((value) => Number.isFinite(value))
        return tiers.length > 0 ? tiers : null
    }

    /**
     * First existing candidate path for the achievements markdown: the active git
     * snapshot root (during init), else the local mount-data fallback.
     *
     * @returns the markdown file path, or null when none exists.
     */
    private resolveFile(): string | null {
        const root = getRuntimeContextRoot()
        const candidates = [
            root ? join(root,
                "achievements",
                "achievements.md") : null,
            join(envConfig().mountPath.data.achievements,
                "achievements.md"),
        ].filter((path): path is string => Boolean(path))
        return candidates.find((path) => existsSync(path)) ?? null
    }
}
