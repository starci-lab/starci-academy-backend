import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    HeadhuntingCompanyTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company-translation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    HeadhuntingCompanyPathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/headhunting-company-path-not-found"
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
    HeadhuntingCompanyIdFactoryService,
} from "../id-factories/headhunting-company.service"
import {
    HEADHUNTINGS_MOUNT_DIR,
} from "../path/constants"
import {
    HeadhuntingCompanyPathService,
} from "../path/headhunting-company.service"

@Injectable()
/**
 * Reads `{index}-{slug}/{en,vi}.md` under `.mount/data/headhuntings/` into a
 * company row + title/description translations. `parseMany` skips a broken
 * folder rather than aborting the whole headhunting seed.
 */
export class HeadhuntingCompanyParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly headhuntingCompanyPathService: HeadhuntingCompanyPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly headhuntingCompanyIdFactoryService: HeadhuntingCompanyIdFactoryService,
        private readonly winstonService: WinstonService,
    ) {}

    async parse(
        companyIndex: number,
        paths: Awaited<ReturnType<HeadhuntingCompanyPathService["paths"]>>,
    ): Promise<DeepPartial<HeadhuntingCompanyEntity>> {
        const path = paths.find(
            (entry) => entry.orderIndex === companyIndex,
        )
        if (!path) {
            throw new HeadhuntingCompanyPathNotFoundException({
                companyIndex,
            })
        }
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        HEADHUNTINGS_MOUNT_DIR,
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        const companyId = this.headhuntingCompanyIdFactoryService.generate({
            companyIndex,
        })
        const buildTranslations = (
            field: string,
            getter: (locale: Locale) => string,
        ): Array<DeepPartial<HeadhuntingCompanyTranslationEntity>> => {
            const rows: Array<DeepPartial<HeadhuntingCompanyTranslationEntity>> = []
            for (const locale of Object.values(Locale)) {
                rows.push({
                    companyId,
                    locale,
                    field,
                    value: getter(locale),
                })
            }
            return rows
        }
        return {
            id: companyId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: this.coerceMdScalarService.toRequiredString(
                jsonMap.get(Locale.En)?.title,
                "",
            ),
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            websiteUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.websiteUrl,
            ),
            logoUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.logoUrl,
            ),
            address: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.address,
            ),
            phone: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.phone,
            ),
            email: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.email,
            ),
            facebookUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.facebookUrl,
            ),
            linkedinUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.linkedinUrl,
            ),
            orderIndex: companyIndex,
            translations: [
                ...buildTranslations(
                    "title",
                    (locale) => this.coerceMdScalarService.toRequiredString(
                        jsonMap.get(locale)?.title,
                        "",
                    ),
                ),
                ...buildTranslations(
                    "description",
                    (locale) => this.coerceMdScalarService.toNullableStringColumn(
                        jsonMap.get(locale)?.description,
                    ) ?? "",
                ),
            ],
        }
    }

    async parseMany(): Promise<Array<ResolvedFileResult<DeepPartial<HeadhuntingCompanyEntity>>>> {
        const paths = await this.headhuntingCompanyPathService.paths()
        const data: Array<ResolvedFileResult<DeepPartial<HeadhuntingCompanyEntity>>> = []
        for (const path of paths) {
            try {
                const company = await this.parse(
                    path.orderIndex,
                    paths,
                )
                data.push({
                    data: company,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    HeadhuntingCompanyEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}
