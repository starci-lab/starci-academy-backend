import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    SeedScopeService,
} from "../../scope"
import {
    CodingProblemParserService,
} from "./parsers"
import {
    CodingProblemInsertService,
} from "./inserts"
import {
    CodingProblemHintIndexService,
} from "./hints"

/**
 * Seeds the coding-practice problem bank from `.mount/data/coding-problems/`
 * into `coding_problems` (+ testcases, starter codes, translations) at boot.
 * Gated by `seed.yaml` seeders `codingProblems`.
 */
@Injectable()
export class CodingProblemSeederService {
    constructor(
        private readonly parserService: CodingProblemParserService,
        private readonly insertService: CodingProblemInsertService,
        private readonly hintIndexService: CodingProblemHintIndexService,
        private readonly winstonService: WinstonService,
        private readonly seedScopeService: SeedScopeService,
    ) {}

    /** Parse mount data → upsert problems. No-op when the seeder is disabled. */
    async seed(): Promise<void> {
        // respect the seed.yaml gate so ops can skip problem seeding per environment
        if (!this.seedScopeService.isCodingProblemsSeederEnabled()) {
            return
        }
        // parse every mount directory into problem rows
        const parsed = await this.parserService.parseMany()
        // nothing to do when the mount has no problems yet
        if (parsed.length === 0) {
            return
        }
        // upsert (idempotent) and capture how many were synced
        const upserted = await this.insertService.upsertMany(parsed)
        // index the approach hints into Elasticsearch (never persisted to Postgres)
        await this.hintIndexService.indexMany(parsed)
        // record the outcome for observability
        this.winstonService.log(
            WinstonLog.SeederFinished,
            {
                seeder: "coding-problems",
                upserted,
            },
        )
    }
}
