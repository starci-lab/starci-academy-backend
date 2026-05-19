import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationEntity,
    FoundationKind,
    FoundationTranslationEntity,
    Locale,
    normalizeFoundationKind,
} from "@modules/databases"
import {
    FoundationPathNotFoundException,
} from "@modules/exceptions"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    ResolvedFileResult,
} from "../../shared"
import {
    FoundationCategoryIdFactoryService,
    FoundationIdFactoryService,
} from "../id-factories"
import {
    FoundationPathService,
} from "../path"
import {
    FoundationTagParserService,
} from "./foundation-tag.service"
import type {
    ParseFoundationManyParams,
    ParseFoundationParams,
} from "./types"

/**
 * Parses foundation items from `{category}/foundations/{index}-{slug}/{en,vi}.md`.
 */
@Injectable()
export class FoundationParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly foundationPathService: FoundationPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly foundationIdFactoryService: FoundationIdFactoryService,
        private readonly foundationCategoryIdFactoryService: FoundationCategoryIdFactoryService,
        private readonly foundationTagParserService: FoundationTagParserService,
    ) { }

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
            translations: (() => {
                const translations: Array<DeepPartial<FoundationTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        foundationId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        foundationId,
                        locale,
                        field: "description",
                        value: this.coerceMdScalarService.toNullableStringColumn(
                            jsonMap.get(locale)?.description,
                        ) ?? "",
                    })
                    translations.push({
                        foundationId,
                        locale,
                        field: "value",
                        value: this.coerceMdScalarService.toNullableStringColumn(
                            jsonMap.get(locale)?.value,
                        ) ?? "",
                    })
                    translations.push({
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
        }
        return data
    }
}
