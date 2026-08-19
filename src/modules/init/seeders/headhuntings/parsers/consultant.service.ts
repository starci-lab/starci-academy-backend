import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ConsultantTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/consultant-translation.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ConsultantPathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/consultant-path-not-found"
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
    ConsultantIdFactoryService,
} from "../id-factories/consultant.service"
import {
    HeadhuntingCompanyIdFactoryService,
} from "../id-factories/headhunting-company.service"
import {
    HEADHUNTINGS_MOUNT_DIR,
} from "../path/constants"
import {
    ConsultantPathService,
} from "../path/consultant.service"
import type {
    ParseConsultantManyParams,
    ParseConsultantParams,
} from "./types/consultant"

@Injectable()
/**
 * Parses headhunting profiles from `{company}/consultants/{index}-{slug}/{en,vi}.md`.
 */
export class ConsultantParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly consultantPathService: ConsultantPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly consultantIdFactoryService: ConsultantIdFactoryService,
        private readonly headhuntingCompanyIdFactoryService: HeadhuntingCompanyIdFactoryService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Coerces a raw `# sortIndex` mount value into a finite number, falling back
     * to the consultant's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the consultant mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback + 1
    }

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
            fullName: this.coerceMdScalarService.toRequiredString(
                jsonMap.get(Locale.En)?.fullName,
                "",
            ),
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
            // pure display-ordering index -- explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                jsonMap.get(Locale.En)?.sortIndex,
                consultantIndex,
            ),
            company: {
                id: companyId,
            },
            translations: [
                ...buildTranslations(
                    "fullName",
                    (locale) => this.coerceMdScalarService.toRequiredString(
                        jsonMap.get(locale)?.fullName,
                        "",
                    ),
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
            try {
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
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ConsultantEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}
