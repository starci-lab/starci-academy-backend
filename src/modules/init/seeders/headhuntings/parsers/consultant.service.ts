import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ConsultantEntity,
    ConsultantTranslationEntity,
    Locale,
} from "@modules/databases"
import {
    ConsultantPathNotFoundException,
} from "@modules/exceptions"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    ResolvedFileResult,
} from "../../shared"
import {
    HeadhuntingCompanyIdFactoryService,
    ConsultantIdFactoryService,
} from "../id-factories"
import {
    HEADHUNTINGS_MOUNT_DIR,
    ConsultantPathService,
} from "../path"
import type {
    ParseConsultantManyParams,
    ParseConsultantParams,
} from "./types"

/**
 * Parses headhunting profiles from `{company}/consultants/{index}-{slug}/{en,vi}.md`.
 */
@Injectable()
export class ConsultantParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly consultantPathService: ConsultantPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly consultantIdFactoryService: ConsultantIdFactoryService,
        private readonly headhuntingCompanyIdFactoryService: HeadhuntingCompanyIdFactoryService,
    ) {}

    async parse(
        {
            paths,
            consultantIndex,
            companyIndex,
        }: ParseConsultantParams,
    ): Promise<DeepPartial<ConsultantEntity>> {
        const path = paths.find(
            (entry) => entry.orderIndex === consultantIndex,
        )
        if (!path) {
            throw new ConsultantPathNotFoundException({
                consultantIndex,
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
        const consultantId = this.consultantIdFactoryService.generate({
            companyIndex,
            consultantIndex,
        })
        const buildTranslations = (
            field: string,
            getter: (locale: Locale) => string,
        ): Array<DeepPartial<ConsultantTranslationEntity>> => {
            const rows: Array<DeepPartial<ConsultantTranslationEntity>> = []
            for (const locale of Object.values(Locale)) {
                rows.push({
                    consultantId,
                    locale,
                    field,
                    value: getter(locale),
                })
            }
            return rows
        }
        return {
            id: consultantId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            fullName: String(jsonMap.get(Locale.En)?.fullName ?? ""),
            jobTitle: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.jobTitle,
            ),
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            linkedinUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.linkedinUrl,
            ),
            email: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.email,
            ),
            phoneNumber: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.phoneNumber,
            ),
            zaloNumber: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.zaloNumber,
            ),
            avatarUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.avatarUrl,
            ),
            orderIndex: consultantIndex,
            company: {
                id: companyId,
            },
            translations: [
                ...buildTranslations(
                    "fullName",
                    (locale) => String(jsonMap.get(locale)?.fullName ?? ""),
                ),
                ...buildTranslations(
                    "jobTitle",
                    (locale) => this.coerceMdScalarService.toNullableStringColumn(
                        jsonMap.get(locale)?.jobTitle,
                    ) ?? "",
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

    async parseMany(
        {
            companyRelativePath,
            companyIndex,
        }: ParseConsultantManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<ConsultantEntity>>>> {
        const paths = await this.consultantPathService.paths({
            companyRelativePath,
        })
        const data: Array<ResolvedFileResult<DeepPartial<ConsultantEntity>>> = []
        for (const path of paths) {
            const consultant = await this.parse({
                paths,
                consultantIndex: path.orderIndex,
                companyIndex,
            })
            data.push({
                data: consultant,
                index: path.orderIndex,
                relativePath: path.relativePath,
            })
        }
        return data
    }
}
