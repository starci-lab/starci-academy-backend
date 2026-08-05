import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserAchievementEntity,
} from "@modules/databases/postgresql/primary/entities/user-achievement.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    PlatformStatsQuery,
} from "./platform-stats.query"
import {
    PlatformStatsData,
} from "./graphql-types/response"
import {
    DistinctLearnersRow,
} from "./types"

@QueryHandler(PlatformStatsQuery)
@Injectable()
/**
 * Counts distinct enrolled learners, lessons, courses, and earned badges in
 * parallel for the public landing-page stats strip.
 */
export class PlatformStatsHandler
    extends ICQRSHandler<PlatformStatsQuery, PlatformStatsData>
    implements IQueryHandler<PlatformStatsQuery, PlatformStatsData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(): Promise<PlatformStatsData> {
        const [
            learnersRow,
            totalLessons,
            totalCourses,
            totalBadgesEarned,
        ] = await Promise.all([
            this.entityManager
                .createQueryBuilder(EnrollmentEntity,
                    "enrollment")
                .select("COUNT(DISTINCT enrollment.user_id)",
                    "count")
                .getRawOne<DistinctLearnersRow>(),
            this.entityManager.count(ContentEntity),
            this.entityManager.count(CourseEntity),
            this.entityManager.count(UserAchievementEntity),
        ])

        return {
            totalLearners: Number(learnersRow?.count ?? 0),
            totalLessons,
            totalCourses,
            totalBadgesEarned,
        }
    }
}
