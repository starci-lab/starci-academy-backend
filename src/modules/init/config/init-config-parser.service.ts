import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import type {
    InitConfig,
    InitSeedCourseValue,
    InitSyncCourseValue,
    InitSyncDomainValue,
    InitSyncSinkScope,
    InitSyncTrackValue,
    ReindexScope,
    SeedConfig,
    SeedCourseTrack,
    SeedScopeIndexes,
    SeedSyncCourseSink,
    SeedSyncCourseTrack,
    SeedSyncDomainSink,
} from "@modules/filesystem/types/seed"
import type {
    IndexMeta,
    ResyncTarget,
} from "./types"

/**
 * Friendly ES index name (as written in `sync.reindex`) -> its entity + resync target.
 *
 * MUST mirror `configMap` in `src/modules/elasticsearch/config.ts` (same 12 indices).
 * Kept here as the single declarative source the parser needs for BOTH the
 * friendly->entity resolution and the index->sync-knob classification.
 */
const INDEX_META: Record<string, IndexMeta> = {
    "courses": {
        entity: CourseEntity.name,
        resync: "courseRoot",
    },
    "modules": {
        entity: ModuleEntity.name,
        resync: "modules",
    },
    "contents": {
        entity: ContentEntity.name,
        resync: "modules",
    },
    "challenges": {
        entity: ChallengeEntity.name,
        resync: "modules",
    },
    "milestones": {
        entity: MilestoneEntity.name,
        resync: "milestones",
    },
    "milestone-tasks": {
        entity: MilestoneTaskEntity.name,
        resync: "milestones",
    },
    "foundations": {
        entity: FoundationEntity.name,
        resync: "foundations",
    },
    "foundation-categories": {
        entity: FoundationCategoryEntity.name,
        resync: "foundations",
    },
    "headhunting-companies": {
        entity: HeadhuntingCompanyEntity.name,
        resync: "headhunting",
    },
    "consultants": {
        entity: ConsultantEntity.name,
        resync: "headhunting",
    },
    "flashcard-decks": {
        entity: FlashcardDeckEntity.name,
        resync: "flashcards",
    },
    "coding-problems": {
        entity: CodingProblemEntity.name,
        resync: "codingProblems",
    },
}

/** An empty (off) per-sink scope -- `[]` skips the whole track on that sink. */
const offSink = (): SeedSyncCourseSink => ({
    cdn: [],
    elasticsearch: [],
    repo: [],
})

@Injectable()
/**
 * Expands the friendly `seed.yaml` {@link InitConfig} surface into the runtime
 * {@link SeedConfig} the seed/sync pipeline consumes.
 *
 * Pure transform (shorthand expansion + sink-master gating + reindex resolution),
 * so it is unit-testable without any infrastructure.
 */
export class InitConfigParserService {

    /**
     * Build the full {@link SeedConfig} from a parsed `seed.yaml`.
     *
     * @param config - The `mode` / `seed:` / `sync:` blocks parsed off `seed.yaml`
     * @param courseDisplayIds - Every course discovered under the active root; used
     *   to fan a reindex's auto-full-resync across the whole corpus
     * @returns The expanded seed + sync config
     */
    parse(
        config: InitConfig,
        courseDisplayIds: Array<string>,
    ): SeedConfig {
        return {
            seeders: this.buildSeeders(config),
            synchronizers: this.buildSynchronizers(config,
                courseDisplayIds),
        }
    }

    /** Expand the `seed:` block into `SeedConfig.seeders`. Absent block -> phase off. */
    private buildSeeders(config: InitConfig): SeedConfig["seeders"] {
        const seed = config.seed
        const enabled = Boolean(seed) && (seed?.enabled ?? true)
        const tracks: Record<string, SeedCourseTrack> = {
        }
        // flashcard/interview seeding are single global passes -> on if ANY course opted in
        let flashcardEnabled = false
        let interviewEnabled = false
        for (const [
            displayId,
            value,
        ] of Object.entries(seed?.courses ?? {
            })) {
            const normalized = this.normalizeSeedCourse(value)
            tracks[displayId] = {
                course: true,
                modules: normalized.modules,
                milestones: normalized.milestones,
            }
            flashcardEnabled = flashcardEnabled || normalized.flashcards
            interviewEnabled = interviewEnabled || normalized.interview
        }
        return {
            enabled,
            courses: {
                enabled,
                tracks,
                flashcard: {
                    enabled: flashcardEnabled,
                },
                interview: {
                    enabled: interviewEnabled,
                },
            },
            cv: seed?.cv ?? false,
            foundations: seed?.foundations ?? false,
            headhunting: seed?.headhunting ?? false,
            aiModels: seed?.aiModels ?? false,
            subscriptions: seed?.subscriptions ?? false,
            codingProblems: seed?.codingProblems ?? false,
            advertisements: seed?.advertisements ?? false,
            changelog: seed?.changelog ?? false,
            blog: seed?.blog ?? false,
            achievements: seed?.achievements ?? false,
            mockInterviewEq: seed?.mockInterviewEq ?? false,
        }
    }

    /** Collapse one `seed.courses` entry (shorthand or object) into its resolved tracks. */
    private normalizeSeedCourse(value: InitSeedCourseValue): {
        modules: SeedScopeIndexes
        milestones: SeedScopeIndexes
        flashcards: boolean
        interview: boolean
    } {
        // shorthand (scope string / index array) -> modules only; other tracks off
        if (!this.isPlainObject(value)) {
            return {
                modules: value,
                milestones: [],
                flashcards: false,
                interview: false,
            }
        }
        return {
            // object form is explicit opt-in: an omitted track stays off
            modules: value.modules ?? [],
            milestones: this.normalizeMilestoneScope(value.milestones),
            flashcards: value.flashcards === true,
            interview: value.interview === true,
        }
    }

    /** `true` -> all, `false`/absent -> off, otherwise the given scope. */
    private normalizeMilestoneScope(
        value: SeedScopeIndexes | boolean | undefined,
    ): SeedScopeIndexes {
        if (value === true) {
            return "all"
        }
        if (value === false || value === undefined) {
            return []
        }
        return value
    }

    /** Expand the `sync:` block into `SeedConfig.synchronizers`. Absent block -> phase off. */
    private buildSynchronizers(
        config: InitConfig,
        courseDisplayIds: Array<string>,
    ): SeedConfig["synchronizers"] {
        const sync = config.sync
        const enabled = Boolean(sync) && (sync?.enabled ?? true)
        // hard master per sink -- a false sink zeros that sink everywhere downstream
        const sinkEnabled = {
            cdn: sync?.sinks?.cdn ?? true,
            elasticsearch: sync?.sinks?.elasticsearch ?? true,
            repo: sync?.sinks?.repo ?? true,
        }
        const courses: Record<string, SeedSyncCourseTrack> = {
        }
        for (const [
            displayId,
            value,
        ] of Object.entries(sync?.courses ?? {
            })) {
            courses[displayId] = this.normalizeSyncCourse(value,
                sinkEnabled)
        }
        const domains = {
            cv: this.normalizeDomain(sync?.cv,
                sinkEnabled),
            foundations: this.normalizeDomain(sync?.foundations,
                sinkEnabled),
            headhunting: this.normalizeDomain(sync?.headhunting,
                sinkEnabled),
            flashcards: this.normalizeDomain(sync?.flashcards,
                sinkEnabled),
            codingProblems: this.normalizeDomain(sync?.codingProblems,
                sinkEnabled),
        }
        const reindex = this.resolveReindex(sync?.reindex)
        // dropping an index -> force its ES sync to full so it never stays empty
        this.applyReindexResync(reindex,
            courses,
            domains,
            courseDisplayIds)
        return {
            enabled,
            reindex,
            courses,
            ...domains,
        }
    }

    /** Collapse one `sync.courses` entry (shorthand or per-track object) into both tracks. */
    private normalizeSyncCourse(
        value: InitSyncCourseValue,
        sinkEnabled: { cdn: boolean; elasticsearch: boolean; repo: boolean },
    ): SeedSyncCourseTrack {
        // shorthand -> same scope on every sink of BOTH tracks
        if (!this.isPlainObject(value)) {
            const sink = this.normalizeTrack(value,
                sinkEnabled)
            return {
                course: true,
                modules: sink,
                milestones: {
                    ...sink,
                },
            }
        }
        return {
            course: true,
            modules: this.normalizeTrack(value.modules,
                sinkEnabled),
            milestones: this.normalizeTrack(value.milestones,
                sinkEnabled),
        }
    }

    /** Resolve one track value (per-sink object or shorthand) -> a gated per-sink sink scope. */
    private normalizeTrack(
        value: InitSyncTrackValue | undefined,
        sinkEnabled: { cdn: boolean; elasticsearch: boolean; repo: boolean },
    ): SeedSyncCourseSink {
        if (value === undefined) {
            return offSink()
        }
        // per-sink object
        if (this.isPlainObject(value)) {
            return this.gateSinks({
                cdn: this.normalizeSinkScope(value.cdn),
                elasticsearch: this.normalizeSinkScope(value.elasticsearch),
                repo: this.normalizeSinkScope(value.repo),
            },
            sinkEnabled)
        }
        // shorthand: one scope applied to all three sinks
        const scope = this.normalizeSinkScope(value)
        return this.gateSinks({
            cdn: scope,
            elasticsearch: scope,
            repo: scope,
        },
        sinkEnabled)
    }

    /** `true` -> all, `false`/absent -> off, otherwise the given scope. */
    private normalizeSinkScope(value: InitSyncSinkScope | undefined): SeedScopeIndexes {
        if (value === true) {
            return "all"
        }
        if (value === false || value === undefined) {
            return []
        }
        return value
    }

    /** Zero each disabled sink so the master `sinks:` switch wins over per-track scopes. */
    private gateSinks(
        sink: SeedSyncCourseSink,
        sinkEnabled: { cdn: boolean; elasticsearch: boolean; repo: boolean },
    ): SeedSyncCourseSink {
        return {
            cdn: sinkEnabled.cdn ? sink.cdn : [],
            elasticsearch: sinkEnabled.elasticsearch ? sink.elasticsearch : [],
            repo: sinkEnabled.repo ? sink.repo : [],
        }
    }

    /** Resolve one `sync.<domain>` entry (bool or per-sink object), gated by `sinks:`. */
    private normalizeDomain(
        value: InitSyncDomainValue | undefined,
        sinkEnabled: { cdn: boolean; elasticsearch: boolean; repo: boolean },
    ): SeedSyncDomainSink {
        const cdn = typeof value === "object"
            ? value.cdn === true
            : value === true
        const elasticsearch = typeof value === "object"
            ? value.elasticsearch === true
            : value === true
        return {
            cdn: cdn && sinkEnabled.cdn,
            elasticsearch: elasticsearch && sinkEnabled.elasticsearch,
        }
    }

    /** Resolve the friendly `sync.reindex` value into a de-duplicated entity-name list. */
    private resolveReindex(reindex: ReindexScope | undefined): Array<string> {
        if (!reindex || reindex === "none") {
            return []
        }
        if (reindex === "all") {
            return [...new Set(Object.values(INDEX_META).map((meta) => meta.entity))]
        }
        const entities = reindex
            .map((name) => INDEX_META[name]?.entity)
            // drop unknown friendly names rather than failing the whole boot
            .filter((entity): entity is string => Boolean(entity))
        return [...new Set(entities)]
    }

    /**
     * For every reindexed index, force its ES sync to FULL across the whole corpus --
     * a dropped index must be repopulated completely, regardless of the configured
     * course/domain scope, or it would be left empty.
     */
    private applyReindexResync(
        reindexEntities: Array<string>,
        courses: Record<string, SeedSyncCourseTrack>,
        domains: {
            foundations: SeedSyncDomainSink
            headhunting: SeedSyncDomainSink
            flashcards: SeedSyncDomainSink
            codingProblems: SeedSyncDomainSink
            cv: SeedSyncDomainSink
        },
        courseDisplayIds: Array<string>,
    ): void {
        const targets = new Set<ResyncTarget>()
        for (const meta of Object.values(INDEX_META)) {
            if (reindexEntities.includes(meta.entity)) {
                targets.add(meta.resync)
            }
        }
        if (targets.size === 0) {
            return
        }
        // ensure a sync track exists for every course so the reset's drop is repopulated
        const ensureCourse = (displayId: string): SeedSyncCourseTrack => {
            const existing = courses[displayId]
            if (existing) {
                return existing
            }
            const created: SeedSyncCourseTrack = {
                course: true,
                modules: offSink(),
                milestones: offSink(),
            }
            courses[displayId] = created
            return created
        }
        const touchesCourses = targets.has("modules")
            || targets.has("milestones")
            || targets.has("courseRoot")
        if (touchesCourses) {
            for (const displayId of courseDisplayIds) {
                const track = ensureCourse(displayId)
                track.course = true
                if (targets.has("modules")) {
                    track.modules.elasticsearch = "all"
                }
                if (targets.has("milestones")) {
                    track.milestones.elasticsearch = "all"
                }
            }
        }
        if (targets.has("foundations")) {
            domains.foundations.elasticsearch = true
        }
        if (targets.has("headhunting")) {
            domains.headhunting.elasticsearch = true
        }
        if (targets.has("flashcards")) {
            domains.flashcards.elasticsearch = true
        }
        if (targets.has("codingProblems")) {
            domains.codingProblems.elasticsearch = true
        }
    }

    /** True for a non-array object (the per-track / per-sink / per-domain object forms). */
    private isPlainObject(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null && !Array.isArray(value)
    }
}
