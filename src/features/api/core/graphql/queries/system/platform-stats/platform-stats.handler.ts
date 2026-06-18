import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserAchievementEntity,
} from "@modules/databases"
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
} from "./graphql-types"
import {
    DistinctLearnersRow,
} from "./types"

@QueryHandler(PlatformStatsQuery)
@Injectable()
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
