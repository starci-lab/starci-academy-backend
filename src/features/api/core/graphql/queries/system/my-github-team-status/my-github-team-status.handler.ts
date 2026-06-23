import {
    Injectable,
} from "@nestjs/common"
import {
    InjectEntityManager,
} from "@nestjs/typeorm"
import {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    UserEntity,
} from "@modules/databases"
import {
    GithubApiOrgService,
} from "@modules/github"
import {
    envConfig,
} from "@modules/env"
import type {
    MyGithubTeamStatusData,
    GithubTeamEntryData,
} from "./graphql-types"

/**
 * Build the viewer's GitHub link + team-membership status. Linking a GitHub
 * identity (githubUsername) and being a member of a course's GitHub team are
 * SEPARATE states — this handler reports both so the FE can force the right step.
 *
 * For each enrolled course that maps to a team (GITHUB_TEAM_SLUGS_BY_COURSE_SLUG),
 * it checks live GitHub membership (active / pending / none). `allInTeam` is true
 * only when every such team is `active`, which is what un-blocks the app.
 */
@Injectable()
export class MyGithubTeamStatusHandler {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly githubApiOrgService: GithubApiOrgService,
    ) {}

    async execute(user: UserEntity): Promise<MyGithubTeamStatusData> {
        const linked = Boolean(user.githubUsername)
        const githubUsername = user.githubUsername ?? null

        // the viewer's enrolled courses (with the course relation for slug/title)
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                relations: {
                    course: true,
                },
            },
        )

        const teamMap = envConfig().services.github.teamSlugsByCourseSlug
        const teams: Array<GithubTeamEntryData> = []

        for (const enrollment of enrollments) {
            const course = enrollment.course
            if (!course) {
                continue
            }
            const teamSlug = teamMap[course.displayId]
            // course without a mapped team needs no membership → skip
            if (!teamSlug) {
                continue
            }

            // membership is only meaningful once a GitHub identity is linked
            let state = "none"
            if (linked && githubUsername) {
                const membership = await this.githubApiOrgService.getUserTeamMembership({
                    teamSlug,
                    githubUsername,
                })
                state = membership.state
            }

            teams.push({
                courseId: course.id,
                courseSlug: course.displayId,
                courseTitle: course.title,
                teamSlug,
                state,
            })
        }

        const allInTeam = teams.every((team) => team.state === "active")

        return {
            linked,
            githubUsername,
            teams,
            allInTeam,
        }
    }
}
