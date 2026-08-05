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
    AdvertisementEntity,
} from "@modules/databases/postgresql/primary/entities/advertisement.entity"
import {
    AdvertisementMediaType,
} from "@modules/databases/postgresql/primary/enums/advertisement-media-type"
import {
    AdvertisementPlacement,
} from "@modules/databases/postgresql/primary/enums/advertisement-placement"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"
import {
    CoerceMdScalarService,
} from "../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../shared/extracts/extract-json-from-md.service"
import type {
    AdvertisementSeedFileRoot,
} from "./types"

@Injectable()
/**
 * Seeds dashboard advertisement banners from `advertisements/advertisements.md`
 * (the git-sourced data root during init, else the local `.mount/data` fallback).
 * The file uses the mount markdown grammar (`# <n>` array items, `## field`
 * object keys); nested `media` / `title` / `ctaText` become jsonb objects.
 * Idempotent: each row is upserted by its `slug`.
 */
export class AdvertisementSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
    ) {}

    /**
     * Parse the advertisements markdown and upsert each banner by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.advertisements`)
        if (!this.seedScopeService.isAdvertisementsSeederEnabled()) {
            return
        }
        // resolve the markdown path (git snapshot root first, else local mount)
        const file = this.resolveFile()
        if (!file) {
            return
        }
        // extract the array root (`# 0`, `# 1`, ... -> wrapped as `{ data: [...] }`)
        const parsed = this.extractJsonFromMdService.extract<AdvertisementSeedFileRoot>(readFileSync(file,
            "utf8"))
        const items = parsed.data ?? []
        for (const item of items) {
            // upsert by the stable slug so re-seeding never duplicates; scalar
            // leaves arrive as strings, so booleans / numbers / dates are coerced
            await this.entityManager.upsert(
                AdvertisementEntity,
                {
                    slug: this.coerceMdScalarService.toRequiredString(item.slug,
                        ""),
                    placement: this.coerceMdScalarService.toRequiredEnum(
                        item.placement,
                        AdvertisementPlacement,
                        AdvertisementPlacement.DashboardRight,
                    ),
                    mediaType: this.coerceMdScalarService.toRequiredEnum(
                        item.mediaType,
                        AdvertisementMediaType,
                        AdvertisementMediaType.Image,
                    ),
                    media: item.media,
                    title: item.title,
                    ctaText: item.ctaText ?? null,
                    linkUrl: this.coerceMdScalarService.toRequiredString(item.linkUrl,
                        ""),
                    sponsorName: this.coerceMdScalarService.toNullableStringColumn(
                        item.sponsorName,
                    ),
                    isHouseAd: this.coerceMdScalarService.toRequiredBoolean(
                        item.isHouseAd,
                        false,
                    ),
                    startsAt: this.coerceMdScalarService.toNullableDate(item.startsAt),
                    endsAt: this.coerceMdScalarService.toNullableDate(item.endsAt),
                    priority: this.coerceMdScalarService.toRequiredNumber(
                        item.priority,
                        0,
                    ),
                    isActive: this.coerceMdScalarService.toRequiredBoolean(
                        item.isActive,
                        true,
                    ),
                },
                ["slug"],
            )
        }
    }

    /**
     * First existing candidate path for the advertisements markdown: the active
     * git snapshot root (during init), else the local mount-data fallback.
     *
     * @returns the markdown file path, or null when none exists.
     */
    private resolveFile(): string | null {
        const root = getRuntimeContextRoot()
        const candidates = [
            root ? join(root,
                "advertisements",
                "advertisements.md") : null,
            join(envConfig().mountPath.data.advertisements,
                "advertisements.md"),
        ].filter((path): path is string => Boolean(path))
        return candidates.find((path) => existsSync(path)) ?? null
    }
}
