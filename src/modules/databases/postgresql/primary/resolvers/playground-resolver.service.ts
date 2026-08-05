import {
    Injectable,
} from "@nestjs/common"
import {
    PlaygroundEntity,
    PlaygroundStepEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"

@Injectable()
/**
 * Applies translations to a playground (and its steps) at request time.
 *
 * The live counterpart of {@link ContentResolverService.transform}: instead of
 * projecting locales once at CDN-build time, playgrounds are read straight from
 * Postgres per request, so the `translations` arrays are resolved here inside
 * the GraphQL handler. The base `title`/`description`/`body` columns still hold
 * the canonical English-first merge value, so an entity with no translation
 * rows falls back to that column rather than blanking out.
 */
export class PlaygroundResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Projects a playground's localizable fields (`title`/`description`) plus
     * each loaded step's (`title`/`body`) to `locale`, then strips the raw
     * translation rows off the graph so the GraphQL response carries the
     * resolved strings, not the translation entities.
     *
     * @param playground - Playground with its `translations` (and, when steps
     * are loaded, `steps.translations`) relation eager-joined.
     * @param locale - Requested locale.
     * @param fallbackLocale - Locale to fall back to (usually {@link Locale.En}).
     */
    transform(
        playground: PlaygroundEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        playground.title = this.translationResolver.resolve(
            {
                translations: playground.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        ) || playground.title
        playground.description = this.translationResolver.resolve(
            {
                translations: playground.translations,
                field: "description",
                locale,
                fallbackLocale,
            },
        ) || playground.description
        delete (playground as Partial<PlaygroundEntity>).translations
        for (const step of playground.steps ?? []) {
            this.transformStep(
                step,
                locale,
                fallbackLocale,
            )
        }
    }

    /**
     * Projects one step's localizable fields (`title`/`body`) to `locale`, then
     * strips its raw translation rows. Exposed on its own so callers that build
     * a step list directly (e.g. the create-session handler) can localize each
     * returned step without loading the whole playground graph.
     *
     * @param step - Step with its `translations` relation eager-joined.
     * @param locale - Requested locale.
     * @param fallbackLocale - Locale to fall back to (usually {@link Locale.En}).
     */
    transformStep(
        step: PlaygroundStepEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): void {
        step.title = this.translationResolver.resolve(
            {
                translations: step.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        ) || step.title
        step.body = this.translationResolver.resolve(
            {
                translations: step.translations,
                field: "body",
                locale,
                fallbackLocale,
            },
        ) || step.body
        delete (step as Partial<PlaygroundStepEntity>).translations
    }

    /**
     * Resolves just a playground's `title` to `locale` without mutating the
     * entity -- used by the playground-list summary, which projects each row
     * into a new lightweight object and only exposes `title`.
     *
     * @param playground - Playground with its `translations` relation eager-joined.
     * @param locale - Requested locale.
     * @param fallbackLocale - Locale to fall back to (usually {@link Locale.En}).
     * @returns The localized title, falling back to the base column value.
     */
    resolveTitle(
        playground: PlaygroundEntity,
        locale: Locale,
        fallbackLocale: Locale,
    ): string {
        return this.translationResolver.resolve(
            {
                translations: playground.translations,
                field: "title",
                locale,
                fallbackLocale,
            },
        ) || playground.title
    }
}
