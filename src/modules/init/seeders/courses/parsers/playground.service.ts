import type {
    ParsePlaygroundManyParams,
    ParsePlaygroundParams,
    PlaygroundsFromDatabaseParams,
    RawPlayground,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    PlaygroundEntity,
} from "@modules/databases"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    CourseIdFactoryService,
    PlaygroundIdFactoryService,
} from "../id-factories"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    PlaygroundPathService,
} from "../path"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    MergeJsonResult,
    MergeJsonService,
    ResolvedFileResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    PlaygroundPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"
import {
    PlaygroundStepParserService,
} from "./playground-step.service"

@Injectable()
/**
 * Parses course-level hands-on playgrounds from mounted course files (`en.md` / `vi.md`)
 * under `courses/{course}/playgrounds/`. Scalar fields use camelCase `#` headings; each
 * step is its own folder under `<playground>/steps/{index}-{slug}/{en,vi}.md`.
 *
 * `title` + `description` are learner-facing prose merged via {@link MergeJsonService};
 * `slug` / `icon` / `sortIndex` are locale-invariant scalars. The base `title`/`description`
 * columns hold the canonical (English-first) value while the per-locale `translations` rows
 * feed {@link PlaygroundTranslationEntity} for request-time locale projection.
 */
export class PlaygroundParserService {
    constructor(
        private readonly playgroundPathService: PlaygroundPathService,
        private readonly playgroundStepParserService: PlaygroundStepParserService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly playgroundIdFactoryService: PlaygroundIdFactoryService,
        private readonly winstonService: WinstonService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Builds a partial playground entity graph from mounted course files.
     *
     * @param params - Playground-locating ordinals and owning course id.
     * @returns Entity-shaped graph for TypeORM cascade upsert.
     */
    async parse(
        {
            paths,
            courseIndex,
            courseId,
            playgroundIndex,
        }: ParsePlaygroundParams,
    ): Promise<DeepPartial<PlaygroundEntity>> {
        // locate the playground folder for the requested ordinal
        const path = paths.find(
            (path) => path.orderIndex === playgroundIndex,
        )
        // a missing folder is a hard error -- caller logs + skips this playground
        if (!path) {
            throw new PlaygroundPathNotFoundException(
                {
                    playgroundIndex,
                },
            )
        }
        // load the markdown for every supported locale into a JSON map
        const jsonMap = new Map<Locale, RawPlayground>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract<RawPlayground>(
                    await this.contextLoaderService.load(
                        "courses",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        // merge locales -> default-locale (English) doc + per-locale translation rows for
        // the `title`/`description` i18n fields (projected live at request time)
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: (jsonMap.get(locale) ?? {
                }) as Record<string, unknown>,
            })),
            translateFields: [
                "title",
                "description",
            ],
        }) as MergeJsonResult<DeepPartial<PlaygroundEntity>>
        // deterministic playground id anchored on the owning course + folder ordinal
        const playgroundId = this.playgroundIdFactoryService.generate(
            {
                courseIndex,
                playgroundIndex,
            },
        )
        return {
            id: playgroundId,
            // owning course FK
            courseId,
            // `# slug` is the URL-facing stable identifier (locale-invariant)
            slug: this.coerceMdScalarService.toRequiredString(
                merged.slug,
                "",
            ),
            // scalar copies sourced from the merged default-locale doc
            title: this.coerceMdScalarService.toRequiredString(
                merged.title,
                "",
            ),
            description: this.coerceMdScalarService.toNullableStringColumn(
                merged.description,
            ),
            icon: this.coerceMdScalarService.toNullableStringColumn(
                merged.icon,
            ),
            // interaction kind (`terminal` | `rag`); absent `# kind` -> `terminal`
            // so legacy Docker/K8s playgrounds keep their existing behaviour
            kind: this.coerceMdScalarService.toRequiredString(
                merged.kind,
                "terminal",
            ),
            // pure display-ordering index -- explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                (merged as { sortIndex?: unknown }).sortIndex,
                playgroundIndex,
            ),
            // each step is its own folder under `<playground>/steps/{index}-{slug}/{en,vi}.md`
            steps: await this.playgroundStepParserService.parseMany(
                {
                    playgroundRelativePath: path.relativePath,
                    courseIndex,
                    playgroundIndex,
                    playgroundId,
                },
            ),
            // per-locale overrides for `title`/`description` -- top-level (one cascade
            // level below the root save), so the raw `playgroundId` scalar is safe here
            // (same as ContentParserService.parse()'s content translations)
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    playgroundId,
                    locale,
                    field,
                    value,
                }),
            ),
        }
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to
     * the supplied `fallback` (the entity's `orderIndex`) when it is missing or not
     * a finite number.
     *
     * @param raw - Raw scalar read from the mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Parses many playgrounds under a course's `playgrounds/` folder.
     *
     * @param params - Course relative path + course ordinal/id.
     * @returns Entity-shaped graphs for TypeORM cascade upsert.
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
            courseId,
        }: ParsePlaygroundManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<PlaygroundEntity>>>> {
        // list every `{index}-{slug}` playground folder for this course
        const paths = await this.playgroundPathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<PlaygroundEntity>>> = []
        for (const path of paths) {
            try {
                // parse one playground; failures are isolated so siblings still seed
                const playground = await this.parse(
                    {
                        paths,
                        courseIndex,
                        courseId,
                        playgroundIndex: path.orderIndex,
                    },
                )
                data.push({
                    data: playground,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                // log + skip a malformed playground instead of aborting the seed
                logInitSeederEntitySkipped(
                    this.winstonService,
                    PlaygroundEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Loads persisted playgrounds for one course (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns Playground rows keyed by deterministic `courseId`.
     */
    async playgroundsFromDatabase(
        params: PlaygroundsFromDatabaseParams,
    ): Promise<Array<PlaygroundEntity>> {
        const {
            courseIndex,
        } = params
        const courseId = this.courseIdFactoryService.generate({
            courseIndex,
        })
        return this.entityManager.find(PlaygroundEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
            })
    }
}
