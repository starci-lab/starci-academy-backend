import {
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    GithubApiOrgService,
} from "./org.service"
import type {
    GithubTeamRepoSyncResult,
} from "./types"

/**
 * Boot-time, idempotent sync of course-team → module-repo access.
 *
 * For each `courseDisplayId → teamSlug` entry in
 * {@link envConfig().services.github.teamSlugsByCourseSlug}, grants the team
 * read access to every org repo named `<courseDisplayId>…` (i.e. the course's
 * module repos). This is what makes "request to team" actually unlock the
 * course code: a learner who joins the team inherits access to all its repos —
 * including ones pushed after the team was created — without anyone clicking
 * Settings → Collaborators & teams by hand.
 *
 * Runs as a standalone `onModuleInit` (NOT inside the seed/init window): the
 * grant depends only on the env mapping + the GitHub API, never on the data
 * snapshot root, and must run even when seeding is disabled (`mode: none`) on
 * fast prod boots. It is fire-and-forget + non-fatal — a slow or unreachable
 * GitHub must never block or crash boot.
 */
@Injectable()
export class GithubTeamRepoSyncService implements OnModuleInit {

    private readonly logger = new Logger(GithubTeamRepoSyncService.name)

    constructor(
        private readonly githubApiOrgService: GithubApiOrgService,
    ) {}

    /**
     * Kicks off the access sync without blocking boot; swallows failures.
     */
    onModuleInit(): void {
        void this.sync().catch((error) => {
            this.logger.error(
                `GitHub team→repo access sync failed (non-fatal): ${error instanceof Error ? error.message : String(error)}`,
            )
        })
    }

    /**
     * Grants every configured team read access to its course's repos. Idempotent.
     *
     * @returns The number of (team, repo) grants applied
     */
    async sync(): Promise<GithubTeamRepoSyncResult> {
        const teamPrefixes = envConfig().services.github.teamRepoPrefixes
        const entries = Object.entries(teamPrefixes)

        if (entries.length === 0) {
            this.logger.log("No team→repo-prefix mapping configured; skipping team→repo access sync")
            return {
                grantedCount: 0,
            }
        }

        // list every org repo once, then match per team by its name prefixes —
        // the real course code repos are per-lesson (`fs-…`, `sd-…`), so a team
        // may map to several prefixes (and never the `…-module-…` placeholders)
        const { repoNames: allRepoNames } = await this.githubApiOrgService.listOrgRepoNamesByPrefix(
            {
                prefix: "",
            },
        )

        let grantedCount = 0
        for (const [teamSlug,
            prefixes] of entries) {
            const repos = allRepoNames.filter(
                (name) => prefixes.some((prefix) => name.startsWith(prefix)),
            )
            for (const repo of repos) {
                await this.githubApiOrgService.grantTeamRepoAccess(
                    {
                        teamSlug,
                        repo,
                        permission: "pull",
                    },
                )
                grantedCount += 1
            }
            this.logger.log(`Team "${teamSlug}" ← ${repos.length} repo(s) (prefixes ${prefixes.join(", ")})`)
        }

        this.logger.log(`GitHub team→repo access sync done: ${grantedCount} grant(s)`)
        return {
            grantedCount,
        }
    }
}
