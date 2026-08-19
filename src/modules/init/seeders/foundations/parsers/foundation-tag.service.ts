import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    FoundationTagEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-tag.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    FoundationTagIdFactoryService,
} from "../id-factories/foundation-tag.service"
import type {
    ParseFoundationTagsParams,
    RawFoundationTagItem,
} from "./types/foundation-tag"

@Injectable()
/**
 * Parses foundation tags from mount `# tags` blocks (`## {index}` -> `### value`) only.
 * Mirrors content `references` parsing in {@link ContentParserService}.
 */
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
            (jsonMap.get(Locale.En)?.tags ?? []) as Array<RawFoundationTagItem>
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
            const translations = Array.from(jsonMap.entries()).flatMap(
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
            )
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
