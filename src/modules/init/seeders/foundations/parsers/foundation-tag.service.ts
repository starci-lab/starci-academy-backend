import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationTagEntity,
    Locale,
} from "@modules/databases"
import {
    CoerceMdScalarService,
} from "../../shared"
import {
    FoundationTagIdFactoryService,
} from "../id-factories"
import type {
    ParseFoundationTagsParams,
} from "./types"

/**
 * Parses foundation tags from mount `# tags` blocks (`## {index}` → `### value`) only.
 * Mirrors content `references` parsing in {@link ContentParserService}.
 */
@Injectable()
export class FoundationTagParserService {
    constructor(
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly foundationTagIdFactoryService: FoundationTagIdFactoryService,
    ) { }

    /**
     * Builds tag rows and per-locale `value` translations from mounted markdown.
     */
    parse(
        {
            jsonMap,
            categoryIndex,
            foundationIndex,
            foundationId,
        }: ParseFoundationTagsParams,
    ): Array<DeepPartial<FoundationTagEntity>> {
        return (
            (jsonMap.get(Locale.En)?.tags ?? []) as Array<{
                orderIndex: number
                sortIndex?: number
                value?: string
            }>
        ).map(({
            orderIndex,
            sortIndex,
            value,
        }) => {
            const tagId = this.foundationTagIdFactoryService.generate({
                categoryIndex,
                foundationIndex,
                tagIndex: orderIndex,
            })
            const tagValue = this.coerceMdScalarService.toRequiredString(
                value,
                "",
            ).trim()
            const translations = Array.from(jsonMap.entries()).map(
                ([
                    locale,
                    item,
                ]) => (
                    ((item.tags ?? []))
                        .filter((tag) => tag.orderIndex === orderIndex)
                        .map((tag) => ({
                            foundationTagId: tagId,
                            locale,
                            field: "value",
                            value: this.coerceMdScalarService.toRequiredString(
                                tag.value,
                                tagValue,
                            ).trim(),
                        }))
                ),
            ).flat()
            return {
                id: tagId,
                orderIndex,
                sortIndex: typeof sortIndex === "number" ? sortIndex : (orderIndex ?? 0),
                value: tagValue,
                defaultLocale: Locale.En,
                foundation: {
                    id: foundationId,
                },
                translations,
            }
        })
    }
}
