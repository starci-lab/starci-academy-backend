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
    load,
} from "js-yaml"
import {
    AdvertisementEntity,
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
import type {
    AdvertisementSeedItem,
} from "./types"

/**
 * Seeds dashboard advertisement banners from `advertisements/advertisements.yaml`
 * (the git-sourced data root during init, else the local `.mount/data` fallback).
 * Idempotent: each row is upserted by its `slug`.
 */
@Injectable()
export class AdvertisementSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
    ) {}

    /**
     * Parse the advertisements YAML and upsert each banner by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.advertisements`)
        if (!this.seedScopeService.isAdvertisementsSeederEnabled()) {
            return
        }
        // resolve the YAML path (git snapshot root first, else local mount)
        const file = this.resolveFile()
        if (!file) {
            return
        }
        // parse the list (empty/missing file → nothing to seed)
        const items = (load(readFileSync(file,
            "utf8")) ?? []) as Array<AdvertisementSeedItem>
        for (const item of items) {
            // upsert by the stable slug so re-seeding never duplicates
            await this.entityManager.upsert(
                AdvertisementEntity,
                {
                    slug: item.slug,
                    placement: item.placement,
                    mediaType: item.mediaType,
                    media: item.media,
                    title: item.title,
                    ctaText: item.ctaText ?? null,
                    linkUrl: item.linkUrl,
                    sponsorName: item.sponsorName ?? null,
                    isHouseAd: item.isHouseAd ?? false,
                    startsAt: item.startsAt ? new Date(item.startsAt) : null,
                    endsAt: item.endsAt ? new Date(item.endsAt) : null,
                    priority: item.priority ?? 0,
                    isActive: item.isActive ?? true,
                },
                ["slug"],
            )
        }
    }

    /**
     * First existing candidate path for the advertisements YAML: the active git
     * snapshot root (during init), else the local mount-data fallback.
     *
     * @returns the YAML file path, or null when none exists.
     */
    private resolveFile(): string | null {
        const root = getRuntimeContextRoot()
        const candidates = [
            root ? join(root,
                "advertisements",
                "advertisements.yaml") : null,
            join(envConfig().mountPath.data.advertisements,
                "advertisements.yaml"),
        ].filter((path): path is string => Boolean(path))
        return candidates.find((path) => existsSync(path)) ?? null
    }
}
