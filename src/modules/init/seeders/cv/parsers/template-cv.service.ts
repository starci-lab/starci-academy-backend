import type {
    ParseTemplateCvParams,
} from "./types/parse-template-cv"
import {
    Injectable,
} from "@nestjs/common"
import {
    join,
    posix,
} from "path"
import {
    DeepPartial,
} from "typeorm"
import {
    TemplateCVTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv-translation.entity"
import {
    TemplateCVEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContextLoaderService,
} from "../../shared/contexts/loader.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import type {
    ResolvedFileResult,
} from "../../shared/path/types"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    TemplateCvIdFactoryService,
} from "../id-factories/template-cv.service"
import {
    parseCvTemplateMarkdown,
} from "./utils/parse-cv-template-markdown"
import {
    TemplateCvPathService 
} from "../path/template-cv.service"

@Injectable()
/**
 * Parses `.mount/data/cv/<key>/{en,vi}.md` into `TemplateCVEntity` partials for insert.
 */
export class TemplateCvParserService {
    constructor(
        private readonly templateCvPathService: TemplateCvPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly templateCvIdFactoryService: TemplateCvIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Builds one template entity from a resolved mount directory, or `null` when `en.md` is missing.
     */
    async parse(
        {
            paths,
            templateIndex,
        }: ParseTemplateCvParams,
    ): Promise<DeepPartial<TemplateCVEntity> | null> {
        const path = paths[templateIndex]
        if (!path) {
            return null
        }

        const {
            relativePath,
        } = path

        const id = this.templateCvIdFactoryService.generate({
            key: relativePath,
        })

        const enPath = join(
            relativePath,
            "en.md",
        ).replace(/\\/g,
            "/")

        let enContent: string | null = null
        try {
            enContent = await this.contextLoaderService.load("cv",
                enPath)
        } catch {
            return null
        }
        if (!enContent) return null

        const en = parseCvTemplateMarkdown(enContent)

        const translations: Array<DeepPartial<TemplateCVTranslationEntity>> = []

        const viPath = join(
            relativePath,
            "vi.md",
        ).replace(/\\/g,
            "/")
        
        let viContent: string | null = null
        try {
            viContent = await this.contextLoaderService.load("cv",
                viPath)
        } catch {
            // vi content is optional
        }

        if (viContent) {
            const vi = parseCvTemplateMarkdown(viContent)

            if (vi.title) {
                translations.push({
                    templateCVId: id,
                    locale: Locale.Vi,
                    field: "title",
                    value: vi.title,
                })
            }
            if (vi.description) {
                translations.push({
                    templateCVId: id,
                    locale: Locale.Vi,
                    field: "description",
                    value: vi.description,
                })
            }
            if (vi.body) {
                translations.push({
                    templateCVId: id,
                    locale: Locale.Vi,
                    field: "body",
                    value: vi.body,
                })
            }
        }

        return {
            id,
            key: relativePath,
            title: en.title,
            description: en.description,
            body: en.body,
            defaultLocale: Locale.En,
            translations,
            orderIndex: templateIndex,
        }
    }

    /**
     * Parses all CV templates from the mount (mirrors course parsers' `parseMany`).
     *
     * @returns Entity-shaped graphs with mount-relative paths for orchestration
     */
    async parseMany(
    ): Promise<Array<ResolvedFileResult<DeepPartial<TemplateCVEntity>>>> {
        const paths = await this.templateCvPathService.paths()
        const data: Array<ResolvedFileResult<DeepPartial<TemplateCVEntity>>> = []

        for (const path of paths) {
            try {
                const template = await this.parse(
                    {
                        paths,
                        templateIndex: path.orderIndex,
                    },
                )
                if (!template) {
                    continue
                }

                data.push({
                    data: template,
                    index: path.orderIndex,
                    relativePath: posix.join(
                        "cv",
                        path.relativePath,
                    ),
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    TemplateCVEntity,
                    posix.join(
                        "cv",
                        path.relativePath,
                    ),
                    error,
                )
            }
        }

        return data
    }
}
