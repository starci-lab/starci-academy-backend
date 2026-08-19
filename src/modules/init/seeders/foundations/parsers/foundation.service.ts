import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-translation.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    FoundationKind,
    normalizeFoundationKind,
} from "@modules/databases/postgresql/primary/enums/foundation-kind"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FoundationPathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/foundation-path-not-found"
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
    ResolvedFileResult,
} from "../../shared/path/types"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    FoundationCategoryIdFactoryService,
} from "../id-factories/foundation-category.service"
import {
    FoundationIdFactoryService,
} from "../id-factories/foundation.service"
import {
    FoundationPathService,
} from "../path/foundation.service"
import {
    FoundationTagParserService,
} from "./foundation-tag.service"
import type {
    ParseFoundationManyParams,
    ParseFoundationParams,
} from "./types/foundation"

@Injectable()
/**
 * Parses foundation items from `{category}/foundations/{index}-{slug}/{en,vi}.md`.
 */
export class FoundationParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly foundationPathService: FoundationPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly foundationIdFactoryService: FoundationIdFactoryService,
        private readonly foundationCategoryIdFactoryService: FoundationCategoryIdFactoryService,
        private readonly foundationTagParserService: FoundationTagParserService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Coerces a raw `# sortIndex` mount value into a finite number, falling back
     * to the foundation's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the foundation mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback + 1
    }

    /**
     * Builds a partial foundation entity from mounted files.
     */
    async parse(
        {
            paths,
            foundationIndex,
            categoryIndex,
        }: ParseFoundationParams,
    ): Promise<DeepPartial<FoundationEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === foundationIndex,
        )
        if (!path) {
            throw new FoundationPathNotFoundException({
                foundationIndex,
            })
        }
        const jsonMap = new Map<Locale, Partial<FoundationEntity>>()
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
        const foundationId = this.foundationIdFactoryService.generate({
            categoryIndex,
            foundationIndex,
        })
        return {
            id: foundationId,
            category: {
                id: categoryId,
            },
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            author: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.author,
            ),
            thumbnailUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.thumbnailUrl,
            ),
            kind: normalizeFoundationKind(
                this.coerceMdScalarService.toRequiredString(
                    (jsonMap.get(Locale.En) as Record<string, unknown>)?.kind,
                    FoundationKind.Document,
                ),
            ),
            value: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.value,
            ),
            isRecommended: this.coerceMdScalarService.toRequiredBoolean(
                jsonMap.get(Locale.En)?.isRecommended,
                false,
            ),
            orderIndex: foundationIndex,
            // pure display-ordering index -- explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                (jsonMap.get(Locale.En) as { sortIndex?: unknown })?.sortIndex,
                foundationIndex,
            ),
            translations: (() => {
                const translations: Array<DeepPartial<FoundationTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        foundationId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    },
                    {
                        foundationId,
                        locale,
                        field: "description",
                        value: this.coerceMdScalarService.toNullableStringColumn(
                            jsonMap.get(locale)?.description,
                        ) ?? "",
                    },
                    {
                        foundationId,
                        locale,
                        field: "value",
                        value: this.coerceMdScalarService.toNullableStringColumn(
                            jsonMap.get(locale)?.value,
                        ) ?? "",
                    },
                    {
                        foundationId,
                        locale,
                        field: "author",
                        value: this.coerceMdScalarService.toNullableStringColumn(
                            jsonMap.get(locale)?.author,
                        ) ?? "",
                    })
                }
                return translations
            })(),
            tags: this.foundationTagParserService.parse({
                jsonMap,
                categoryIndex,
                foundationIndex,
                foundationId,
            }),
        }
    }

    /**
     * Parses many foundations from the mount.
     */
    async parseMany(
        {
            categoryRelativePath,
            categoryIndex,
        }: ParseFoundationManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<FoundationEntity>>>> {
        const paths = await this.foundationPathService.paths({
            categoryRelativePath,
        })
        const data: Array<ResolvedFileResult<DeepPartial<FoundationEntity>>> = []
        for (const path of paths) {
            try {
                const foundation = await this.parse({
                    paths,
                    foundationIndex: path.orderIndex,
                    categoryIndex,
                })
                data.push({
                    data: foundation,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    FoundationEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}
