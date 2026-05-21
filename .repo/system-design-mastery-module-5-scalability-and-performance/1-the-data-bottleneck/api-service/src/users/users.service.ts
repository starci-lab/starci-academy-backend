/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import Redis from "ioredis"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name)

/**
 * Logic — Xử lý nghiệp vụ `userCacheKey` cho lab.
 * Code — `userCacheKey()` — logic trong service/controller.
 * (EN Logic: Business handler `userCacheKey` for the lab.)
 * (EN Code: `userCacheKey()` — in-class handler logic.)
 */
    private userCacheKey(id: number): string {
        return `user:${id}`
    }

    /**
 * Logic — Ghi/sự kiện mới qua `create`.
 * Code — Validate input → mutate state / emit message → return summary.
 * (EN Logic: Write/event via `create`.)
 * (EN Code: Validate → mutate state / emit → return summary.)
 */
    async create(dto: CreateUserDto): Promise<UserEntity> {
        const host = hostname()
        const masterRunner = this.dataSource.createQueryRunner("master")
        await masterRunner.connect()
        try {
            const exists = await masterRunner.manager.findOne(UserEntity,
                {
                    where: {
                        email: dto.email 
                    },
                })
            if (exists) {
                throw new ConflictException(`Email already exists: ${dto.email}`)
            }
            this.logger.log(
                `[${host}] Write path: INSERT users (explicit master query runner)`,
            )
            const entity = masterRunner.manager.create(UserEntity,
                dto)
            const saved = await masterRunner.manager.save(entity)
            await this.cacheManager.del(this.userCacheKey(saved.id))
            return saved
        } finally {
            await masterRunner.release()
        }
    }

    /**
 * Logic — Đọc/truy vấn dữ liệu qua `findOne`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `findOne`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async findOne(id: number): Promise<UserEntity | null> {
        const host = hostname()
        const ck = this.userCacheKey(id)
        const cached = await this.cacheManager.get<UserEntity>(ck)
        if (cached !== undefined && cached !== null) {
            this.logger.log(
                `[${host}] Read path: cache HIT user:${id} — Keyv/Redis via CacheModule, no SQL`,
            )
            return cached
        }
        this.logger.log(
            `[${host}] Read path: cache MISS — SELECT via TypeORM replica pool`,
        )
        const row = await this.usersRepo.findOne({
            where: {
                id 
            } 
        })
        if (!row) {
            return null
        }
        await this.cacheManager.set(ck,
            row,
            USER_CACHE_TTL_MS)
        return row
    }
}
