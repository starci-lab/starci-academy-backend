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

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class FailoverService {
    private readonly logger = new Logger(FailoverService.name)

/**
 * Logic — Đọc/truy vấn dữ liệu qua `findAll`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `findAll`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async findAll(): Promise<FailoverEntity[]> {
        return this.repository.find()
    }

    /**
 * Logic — Ghi/sự kiện mới qua `create`.
 * Code — Validate input → mutate state / emit message → return summary.
 * (EN Logic: Write/event via `create`.)
 * (EN Code: Validate → mutate state / emit → return summary.)
 */
    async create(dto: CreateFailoverDto): Promise<FailoverEntity> {
        const entity = new FailoverEntity()
        entity.title = dto.title
        return this.repository.save(entity)
    }
}
