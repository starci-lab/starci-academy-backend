import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AchievementEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    SeedScopeService,
} from "../../scope"
import {
    STARTER_ACHIEVEMENTS,
} from "./constants"

/**
 * Seeds the curated starter achievement definitions from the in-code catalog
 * ({@link STARTER_ACHIEVEMENTS}). Idempotent: each row is upserted by its
 * `slug`, so re-seeding refreshes copy/thresholds without duplicating. The
 * badge art object key is derived from the slug (`badges/achievements/<slug>.png`).
 */
@Injectable()
export class AchievementSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
    ) {}

    /**
     * Upsert every starter achievement by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.achievements`)
        if (!this.seedScopeService.isAchievementsSeederEnabled()) {
            return
        }
        for (const item of STARTER_ACHIEVEMENTS) {
            // upsert by the stable slug so re-seeding never duplicates
            await this.entityManager.upsert(
                AchievementEntity,
                {
                    slug: item.slug,
                    name: item.name,
                    description: item.description,
                    criteriaType: item.criteriaType,
                    threshold: item.threshold,
                    tierThresholds: item.tierThresholds ?? null,
                    // badge art lives at a slug-derived MinIO key (client renders + falls back)
                    iconKey: `badges/achievements/${item.slug}.png`,
                    sortIndex: item.sortIndex,
                },
                ["slug"],
            )
        }
    }
}
