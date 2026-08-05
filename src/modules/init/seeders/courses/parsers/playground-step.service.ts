import type {
    ParsePlaygroundStepsParams,
    RawPlaygroundStep,
} from "./types/playground"
import {
    Injectable,
} from "@nestjs/common"
import {
    PlaygroundStepTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step-translation.entity"
import {
    PlaygroundStepEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    DeepPartial,
} from "typeorm"
import {
    PlaygroundStepIdFactoryService,
} from "../id-factories/playground-step.service"
import {
    PlaygroundStepPathService,
} from "../path/playground-step.service"
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
    MergeJsonService,
} from "../../shared/merge/merge.service"
import {
    MergeJsonResult,
} from "../../shared/merge/types/merge-json"

@Injectable()
/**
 * Parses the per-step folders under a playground's `steps/` directory -- one folder
 * per ordered step (`{index}-{slug}/{en,vi}.md`). Each step folder holds `{en,vi}.md`
 * with top-level `# title` / `# body` / `# commandHint` / `# verifyResourceKind` /
 * `# verifyResourceNamePattern` / `# verifyExpectedStatus` headings.
 *
 * `title` + `body` are learner-facing prose merged via {@link MergeJsonService}; the
 * remaining fields are scalar. The base `title`/`body` columns hold the canonical
 * (English-first) value while the per-locale `translations` rows feed
 * {@link PlaygroundStepTranslationEntity} for request-time locale projection.
 */
export class PlaygroundStepParserService {
    constructor(
        private readonly playgroundStepPathService: PlaygroundStepPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly playgroundStepIdFactoryService: PlaygroundStepIdFactoryService,
    ) { }

    /**
     * Builds partial playground step entity graphs from the mounted `steps/` folders.
     *
     * @param params - Playground folder path + owning course/playground ordinals + playground id.
     * @returns Step entity partials for TypeORM cascade upsert (empty when no `steps/` dir).
     */
    async parseMany(
        {
            playgroundRelativePath,
            courseIndex,
            playgroundIndex,
            playgroundId,
        }: ParsePlaygroundStepsParams,
    ): Promise<Array<DeepPartial<PlaygroundStepEntity>>> {
        // list numeric `{index}-{slug}` step folders; absent `steps/` dir yields zero rows
        const stepPaths = await this.playgroundStepPathService.paths({
            playgroundRelativePath,
        })
        const steps: Array<DeepPartial<PlaygroundStepEntity>> = []
        for (const stepPath of stepPaths) {
            // load every locale's single-step markdown into a JSON map
            const stepJsonMap = new Map<Locale, RawPlaygroundStep>()
            for (const locale of Object.values(Locale)) {
                stepJsonMap.set(
                    locale,
                    this.extractJsonFromMdService.extract<RawPlaygroundStep>(
                        await this.contextLoaderService.load(
                            "courses",
                            `${stepPath.relativePath}/${locale}.md`,
                        ),
                    ),
                )
            }
            // merge locales -> default-locale (English) step + per-locale translation rows
            // for the `title`/`body` i18n fields (projected live at request time)
            const merged = this.mergeJsonService.merge({
                jsons: Object.values(Locale).map((locale) => ({
                    locale,
                    json: (stepJsonMap.get(locale) ?? {
                    }) as Record<string, unknown>,
                })),
                translateFields: [
                    "title",
                    "body",
                ],
            }) as MergeJsonResult<DeepPartial<PlaygroundStepEntity>>
            // deterministic step id anchored on the playground + step folder ordinal
            const playgroundStepId = this.playgroundStepIdFactoryService.generate({
                courseIndex,
                playgroundIndex,
                playgroundStepIndex: stepPath.orderIndex,
            })
            // per-locale overrides for `title`/`body`. Steps cascade-save TWO levels deep
            // (playground -> steps -> step.translations), so set the FK via the RELATION --
            // `playground_step_id` is BOTH the FK and part of the composite PK, and a
            // raw-only scalar can land null on the nested insert (the same crash guarded
            // against in ContentParserService.parseBodies()'s content_body_translations).
            const stepTranslations: Array<DeepPartial<PlaygroundStepTranslationEntity>> =
                (merged.translations ?? []).map(({
                    locale,
                    field,
                    value,
                }) => ({
                    playgroundStep: {
                        id: playgroundStepId,
                    },
                    locale,
                    field,
                    value,
                }))
            steps.push({
                id: playgroundStepId,
                // pure display-ordering index -- explicit `# sortIndex`, else falls back to orderIndex
                sortIndex: this.toSortIndex(
                    (merged as { sortIndex?: unknown }).sortIndex,
                    stepPath.orderIndex,
                ),
                title: this.coerceMdScalarService.toRequiredString(
                    merged.title,
                    "",
                ),
                body: this.coerceMdScalarService.toRequiredString(
                    merged.body,
                    "",
                ),
                // nullable: absent `# commandHint` heading -> null
                commandHint: this.coerceMdScalarService.toNullableStringColumn(
                    merged.commandHint,
                ),
                // RAG-kind counterparts -- nullable: absent heading -> null (terminal steps)
                actionHint: this.coerceMdScalarService.toNullableStringColumn(
                    merged.actionHint,
                ),
                verifyKind: this.coerceMdScalarService.toNullableStringColumn(
                    merged.verifyKind,
                ),
                // NOT NULL server-only verify columns -- empty pattern (`""` = match any) is
                // intentional and must stay an empty string, NOT collapse to null
                verifyResourceKind: this.coerceMdScalarService.toRequiredString(
                    merged.verifyResourceKind,
                    "",
                ),
                verifyResourceNamePattern: this.coerceMdScalarService.toRequiredString(
                    merged.verifyResourceNamePattern,
                    "",
                ),
                // nullable: absent `# verifyExpectedStatus` heading -> null (existence check only)
                verifyExpectedStatus: this.coerceMdScalarService.toNullableStringColumn(
                    merged.verifyExpectedStatus,
                ),
                playground: {
                    id: playgroundId,
                },
                translations: stepTranslations,
            })
        }
        return steps
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to
     * the supplied `fallback` (the step folder's `orderIndex`) when it is missing or
     * not a finite number.
     *
     * @param raw - Raw scalar read from the mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }
}
