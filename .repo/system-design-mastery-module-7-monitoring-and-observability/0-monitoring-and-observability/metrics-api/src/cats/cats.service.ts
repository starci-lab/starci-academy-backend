/**
 * Cat CRUD service — TypeORM repository + seed one row if table empty.
 */
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    CreateCatDto,
} from "./dto"
import {
    CatEntity,
} from "../entities"

@Injectable()
/**
 * Class `CatsService` — lesson lab component.
 */
export class CatsService implements OnModuleInit {
    /**
     * Logic: All cat persistence goes through ORM repo for table `cats` (demo bounded context).
     * Code: `@InjectRepository(CatEntity)` supplies `Repository<CatEntity>` from `TypeOrmModule.forFeature`.
     */
    constructor(
        @InjectRepository(CatEntity)
        private readonly cats: Repository<CatEntity>,
    ) {}

    /**
     * Logic: Fresh empty DB still yields one row so GET `/cats` and metrics are meaningful.
     * Code: `OnModuleInit` hook: `await count()`; branch `0` runs `create` + `save` (single insert).
     */
    async onModuleInit(): Promise<void> {
        // Logic: Seed only when empty so restarts do not duplicate Tom.
        // Code: `count()` returns row count on `cats` (lab: single writer, no txn).
        if ((await this.cats.count()) === 0) {
            await this.cats.save(
                this.cats.create({
                    name: "Tom",
                    age: 3,
                }),
            )
        }
    }

    /**
     * Logic: Return all cats ordered by id ascending (stable API/metric contract).
     * Code: `find` with `order.id ASC` → SQL `ORDER BY id ASC`.
     */
    async findAll(): Promise<CatEntity[]> {
        return this.cats.find({
            order: {
                id: "ASC",
            },
        })
    }

    /**
     * Logic: Append cat from validated input; DB assigns id after save.
     * Code: `create` builds unstaged entity; `save` runs INSERT and returns entity with `id`.
     */
    async create(dto: CreateCatDto): Promise<CatEntity> {
        return this.cats.save(this.cats.create({
            name: dto.name,
            age: dto.age,
        }))
    }
}
