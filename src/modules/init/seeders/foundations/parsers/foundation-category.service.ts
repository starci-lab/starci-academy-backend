import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationCategoryEntity,
    FoundationCategoryTranslationEntity,
    Locale,
} from "@modules/databases"
import {
    FoundationCategoryPathNotFoundException,
} from "@modules/exceptions"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    ResolvedFileResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import {
    S3BuildService,
    S3Provider,
} from "@modules/s3"
import {
    FoundationCategoryIdFactoryService,
} from "../id-factories"
import {
    FoundationCategoryPathService,
} from "../path"
import type {
    ParseFoundationCategoryParams,
} from "./types"

@Injectable()
/**
 * Parses a foundation category root (`en.md`, `vi.md`) under `foundations/{index}-{slug}/`.
 */
export class FoundationCategoryParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly foundationCategoryPathService: FoundationCategoryPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly foundationCategoryIdFactoryService: FoundationCategoryIdFactoryService,
        private readonly winstonService: WinstonService,
        private readonly s3BuildService: S3BuildService,
    ) { }

    /**
     * Resolve a raw `thumbnailUrl` from the mount into the URL persisted to the DB.
     *
     * Absolute URLs (`http(s)://...`) are kept verbatim, so legacy externally-hosted
     * thumbnails keep working. Anything else is treated as a MinIO object key (e.g.
     * `assets/nestjs.png`, synced by the assets module) and expanded into a public,
     * env-aware URL — this is what lets the committed seed stay deployment-agnostic
     * while the DB ends up with the correct per-environment MinIO public link.
     *
     * @param value - Raw thumbnail value from the mount, or `null` when absent.
     * @returns The resolved absolute URL, or `null` when no thumbnail is set.
     */
    private resolveThumbnailUrl(value: string | null): string | null {
        // no thumbnail configured → nothing to resolve
        if (!value) {
            return null
        }
        // already an absolute URL (external host) → keep as-is
        if (/^https?:\/\//i.test(value)) {
            return value
        }
        // otherwise treat the value as a MinIO object key; strip any leading slash first
        const key = value.replace(/^\/+/,
            "")
        // build the public, anonymously-readable URL for the synced asset on MinIO
        return this.s3BuildService.buildPublicObjectUrl({
            key,
            provider: S3Provider.Minio,
        })
    }

    /**
     * Coerces a raw `# sortIndex` mount value into a finite number, falling back
     * to the category's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the category mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback + 1
    }

    /**
     * Builds a partial foundation category entity from the mount.
     */
    async parse(
        {
            paths,
            categoryIndex,
        }: ParseFoundationCategoryParams,
    ): Promise<DeepPartial<FoundationCategoryEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === categoryIndex,
        )
        if (!path) {
            throw new FoundationCategoryPathNotFoundException({
                categoryIndex,
            })
        }
        const jsonMap = new Map<Locale, Partial<FoundationCategoryEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "foundations",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        const categoryId = this.foundationCategoryIdFactoryService.generate({
            categoryIndex,
        })
        return {
            id: categoryId,
            defaultLocale: Locale.En,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            displayId: path.displayId,
            thumbnailUrl: this.resolveThumbnailUrl(
                this.coerceMdScalarService.toNullableStringColumn(
                    jsonMap.get(Locale.En)?.thumbnailUrl,
                ),
            ),
            orderIndex: categoryIndex,
            // pure display-ordering index — explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                (jsonMap.get(Locale.En) as { sortIndex?: unknown })?.sortIndex,
                categoryIndex,
            ),
            translations: (() => {
                const translations: Array<DeepPartial<FoundationCategoryTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        categoryId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        categoryId,
                        locale,
                        field: "description",
                        value: this.coerceMdScalarService.toNullableStringColumn(
                            jsonMap.get(locale)?.description,
                        ) ?? "",
                    })
                }
                return translations
            })(),
        }
    }

    /**
     * Parses many foundation categories from the mount.
     */
    async parseMany(): Promise<Array<ResolvedFileResult<DeepPartial<FoundationCategoryEntity>>>> {
        const paths = await this.foundationCategoryPathService.paths()
        const data: Array<ResolvedFileResult<DeepPartial<FoundationCategoryEntity>>> = []
        for (const path of paths) {
            try {
                const category = await this.parse({
                    paths,
                    categoryIndex: path.orderIndex,
                })
                data.push({
                    data: category,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    FoundationCategoryEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}
