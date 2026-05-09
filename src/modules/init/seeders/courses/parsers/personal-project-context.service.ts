import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PersonalProjectContextEntity,
    PersonalProjectContextTranslationEntity,
} from "@modules/databases"
import {
    CourseIdFactoryService,
    PersonalProjectContextIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ContextLoaderService,
} from "../contexts"
import {
    PersonalProjectContextPathService,
} from "../path"

/**
 * Input for {@link PersonalProjectContextParserService.parseMany}.
 */
export interface ParsePersonalProjectContextManyParams {
    courseRelativePath: string
    courseIndex: number
}

/**
 * Parses personal project context files (requirements + roadmap) from
 * `personal-project-context/{requirements|roadmap}/{locale}.md` under a course directory.
 *
 * Merges both into a **single row per course**.
 */
@Injectable()
export class PersonalProjectContextParserService {
    constructor(
        private readonly courseIdFactoryService: CourseIdFactoryService,
        private readonly personalProjectContextIdFactoryService: PersonalProjectContextIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly personalProjectContextPathService: PersonalProjectContextPathService,
    ) { }

    /**
     * Parses the single personal project context for a course from the mount.
     *
     * @param params - Course relative path and index
     * @returns Entity-shaped graph for TypeORM cascade save, or `null` if no content
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
        }: ParsePersonalProjectContextManyParams,
    ): Promise<Array<DeepPartial<PersonalProjectContextEntity>>> {
        const contextBasePath = this.personalProjectContextPathService.relativePath(courseRelativePath)
        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )
        const contextId = this.personalProjectContextIdFactoryService.generate(
            {
                courseIndex,
            },
        )

        /** Load English content for the top-level columns. */
        const requirementsEn = await this.loadSafe(
            `${contextBasePath}/requirements/${Locale.En}.md`,
        )
        const roadmapEn = await this.loadSafe(
            `${contextBasePath}/roadmap/${Locale.En}.md`,
        )

        /** If neither exists, skip this course entirely. */
        if (!requirementsEn && !roadmapEn) {
            return []
        }

        /** Build translations — combine requirements + roadmap content per locale. */
        const translations: Array<DeepPartial<PersonalProjectContextTranslationEntity>> = []

        for (const locale of Object.values(Locale)) {
            const reqContent = await this.loadSafe(
                `${contextBasePath}/requirements/${locale}.md`,
            )
            const roadmapContent = await this.loadSafe(
                `${contextBasePath}/roadmap/${locale}.md`,
            )

            /** Combine both into a single translation content block. */
            const parts: Array<string> = []
            if (reqContent) {
                parts.push(reqContent)
            }
            if (roadmapContent) {
                parts.push(roadmapContent)
            }

            if (parts.length > 0) {
                translations.push({
                    personalProjectContextId: contextId,
                    locale,
                    content: parts.join("\n\n---\n\n"),
                })
            }
        }

        const entity: DeepPartial<PersonalProjectContextEntity> = {
            id: contextId,
            orderIndex: 0,
            requirements: requirementsEn ?? undefined,
            roadmap: roadmapEn ?? undefined,
            course: {
                id: courseId,
            },
            translations,
        }

        return [entity]
    }

    /**
     * Load a file, returning `null` if it doesn't exist or is empty.
     */
    private async loadSafe(path: string): Promise<string | null> {
        try {
            const content = await this.contextLoaderService.load(path)
            return content && content.trim().length > 0
                ? content.trim()
                : null
        } catch {
            return null
        }
    }
}
