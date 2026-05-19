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
} from "../../shared"
import {
    FoundationCategoryIdFactoryService,
} from "../id-factories"
import {
    FoundationCategoryPathService,
} from "../path"
import type {
    ParseFoundationCategoryParams,
} from "./types"

/**
 * Parses a foundation category root (`en.md`, `vi.md`) under `foundations/{index}-{slug}/`.
 */
@Injectable()
export class FoundationCategoryParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly foundationCategoryPathService: FoundationCategoryPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly foundationCategoryIdFactoryService: FoundationCategoryIdFactoryService,
    ) { }

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
            thumbnailUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.thumbnailUrl,
            ),
            orderIndex: categoryIndex,
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
            const category = await this.parse({
                paths,
                categoryIndex: path.orderIndex,
            })
            data.push({
                data: category,
                index: path.orderIndex,
                relativePath: path.relativePath,
            })
        }
        return data
    }
}
