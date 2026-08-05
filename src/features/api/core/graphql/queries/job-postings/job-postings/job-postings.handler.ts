import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
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
    ILike,
    type EntityManager,
} from "typeorm"
import {
    clampPagination,
} from "@modules/lib/common/utils/pagination"
import {
    JobPostingsQuery,
} from "./job-postings.query"
import type {
    JobPostingsData,
} from "./graphql-types/response"

@QueryHandler(JobPostingsQuery)
@Injectable()
/**
 * Lists job postings from Postgres (newest first), with optional work-mode /
 * employment-type filters and a case-insensitive title search. Public -- no
 * auth/enrollment guard, this is an open job board.
 */
export class JobPostingsHandler
    extends ICQRSHandler<JobPostingsQuery, JobPostingsData>
    implements IQueryHandler<JobPostingsQuery, JobPostingsData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: JobPostingsQuery,
    ): Promise<JobPostingsData> {
        const {
            request: {
                limit = 20,
                offset = 0,
                workMode,
                employmentType,
                search,
            },
        } = query.params

        // clamp the page size so a caller can't force an unbounded scan
        const {
            limit: take,
            offset: skip,
        } = clampPagination(limit,
            offset)

        // optional case-insensitive title search
        const trimmedSearch = search?.trim()

        const [
            items,
            total,
        ] = await this.entityManager.findAndCount(
            JobPostingEntity,
            {
                where: {
                    // undefined filters are dropped by TypeORM's `where`, so
                    // omitting a param means "match anything"
                    workMode,
                    employmentType,
                    ...(trimmedSearch
                        ? {
                            title: ILike(`%${trimmedSearch}%`) 
                        }
                        : {
                        }),
                },
                // company is always needed to render the poster's identity
                // (name/logo) on the list -- load it eagerly to avoid N+1
                relations: {
                    company: true,
                },
                order: {
                    createdAt: "DESC",
                },
                take,
                skip,
            },
        )

        return {
            items,
            total,
        }
    }
}
