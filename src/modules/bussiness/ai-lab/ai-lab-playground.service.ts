import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiLabPlaygroundEntity,
    AiLabRunEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    TranslationResolverService,
} from "@modules/databases"
import type {
    GetPlaygroundForLessonParams,
    GetPlaygroundForLessonResult,
    ListMyRunsParams,
    ListMyRunsResult,
} from "./types"

/**
 * Read access to AI Lab playgrounds + a learner's run history.
 *
 * A playground is attached to one lesson content; the GraphQL surface needs the
 * full config (default prompts, params, allowed providers) plus the localized
 * label / description. The label / description live only in the translation
 * table, so we resolve them here and expose them as plain entity fields the
 * `@ObjectType` already declares.
 */
@Injectable()
export class AiLabPlaygroundService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly translationResolver: TranslationResolverService,
    ) { }

    /**
     * Load the playground attached to a lesson content, localized to `locale`.
     *
     * @param params - Lesson content id + locale to localize into.
     * @returns The localized playground, or null when the lesson has none.
     */
    async getPlaygroundForLesson(
        {
            contentId,
            locale,
        }: GetPlaygroundForLessonParams,
    ): Promise<GetPlaygroundForLessonResult> {
        // load the playground for this lesson with its translation rows attached;
        // a lesson may legitimately have no playground (most lessons do not)
        const playground = await this.entityManager.findOne(
            AiLabPlaygroundEntity,
            {
                where: {
                    content: {
                        id: contentId,
                    },
                },
                relations: {
                    translations: true,
                },
            },
        )
        // no playground on this lesson → hand back null so the resolver returns null
        if (!playground) {
            return {
                playground: null,
            }
        }
        // localize the label / description from the translation rows in place
        this.localize(
            playground,
            locale,
        )
        return {
            playground,
        }
    }

    /**
     * List a learner's runs in one playground, newest first.
     *
     * @param params - Owning user + playground to scope to.
     * @returns The user's runs in this playground.
     */
    async listMyRuns(
        {
            userId,
            playgroundId,
        }: ListMyRunsParams,
    ): Promise<ListMyRunsResult> {
        // scope strictly to this user's own runs in this playground — never leak
        // another learner's prompts / outputs
        const runs = await this.entityManager.find(
            AiLabRunEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    playground: {
                        id: playgroundId,
                    },
                },
                // newest first so the FE history list reads top-down
                order: {
                    createdAt: "DESC",
                },
            },
        )
        return {
            runs,
        }
    }

    /**
     * Resolve the localized `label` / `description` onto the playground from its
     * translation rows, then strip the consumed translations array (mirrors the
     * flashcard-deck resolver). Mutates in place.
     *
     * @param playground - The loaded playground (with translations attached).
     * @param locale - The requested locale.
     */
    private localize(
        playground: AiLabPlaygroundEntity,
        locale: Locale,
    ): void {
        // fall back to the playground's own default locale when the requested one is missing
        const fallbackLocale = playground.defaultLocale ?? Locale.En
        // resolve each localized field from the loaded translation rows (no extra I/O)
        const label = this.translationResolver.resolve(
            {
                translations: playground.translations,
                field: "label",
                locale,
                fallbackLocale,
            },
        )
        const description = this.translationResolver.resolve(
            {
                translations: playground.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        )
        // attach the resolved values as ad-hoc fields the GraphQL object type exposes;
        // the entity itself stores these only in translations, so widen to attach them
        const localized = playground as AiLabPlaygroundEntity & {
            label?: string
            description?: string
        }
        localized.label = label
        localized.description = description
        // drop the consumed translations so they are not serialized twice
        delete (playground as Partial<AiLabPlaygroundEntity>).translations
    }
}
