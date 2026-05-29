import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    isCodingProblemsSeederEnabled,
} from "../shared/scope"
import {
    CodingProblemParserService,
} from "./parsers"
import {
    CodingProblemInsertService,
} from "./inserts"

/**
 * Seeds the coding-practice problem bank from `.mount/data/coding-problems/`
 * into `coding_problems` (+ testcases, starter codes, translations) at boot.
 * Gated by `INIT_SEEDERS_CODING_PROBLEMS`.
 */
@Injectable()
export class CodingProblemSeederService {
    constructor(
        private readonly parserService: CodingProblemParserService,
        private readonly insertService: CodingProblemInsertService,
        private readonly winstonService: WinstonService,
    ) {}

    /** Parse mount data → upsert problems. No-op when the seeder is disabled. */
    async seed(): Promise<void> {
        // respect the env gate so ops can skip problem seeding per environment
        if (!isCodingProblemsSeederEnabled()) {
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
