/**
 * Service CRUD mèo — TypeORM repository + seed một bản ghi nếu bảng trống.
 * (EN: Cat CRUD service — TypeORM repository + seed one row if table empty.)
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
} from "."
import {
    CatEntity,
} from "."

@Injectable()
/**
 * Class `CatsService` — thành phần lab (controller/service/module).
 * (EN: Class `CatsService` — lesson lab component.)
 */
export class CatsService implements OnModuleInit {
    /**
     * Logic — toàn bộ thao tác mèo đi qua repository TypeORM của bảng `cats` (đúng bounded context demo).
     * Code — `@InjectRepository(CatEntity)` lấy `Repository<CatEntity>` do `TypeOrmModule.forFeature` cung cấp.
     * (EN Logic: All cat persistence goes through ORM repo for table `cats` (demo bounded context).)
     * (EN Code: `@InjectRepository(CatEntity)` supplies `Repository<CatEntity>` from `TypeOrmModule.forFeature`.)
     */
    constructor(
        @InjectRepository(CatEntity)
        private readonly cats: Repository<CatEntity>,
    ) {}

    /**
     * Logic — khi DB mới/trống, lab vẫn có ít nhất một bản ghi để GET `/cats` và Prometheus thấy traffic có nghĩa.
     * Code — hook `OnModuleInit`: `await count()`; nhánh `0` gọi `create` + `save` (insert một hàng).
     * (EN Logic: Fresh empty DB still yields one row so GET `/cats` and metrics are meaningful.)
     * (EN Code: `OnModuleInit` hook: `await count()`; branch `0` runs `create` + `save` (single insert).)
     */
    async onModuleInit(): Promise<void> {
        // Logic — chỉ seed khi chưa có dữ liệu, tránh nhân đôi Tom mỗi lần restart.
        // Code — `count()` trả số hàng bảng `cats` (lab: không cần transaction vì một instance ghi).
        // (EN Logic: Seed only when empty so restarts do not duplicate Tom.)
        // (EN Code: `count()` returns row count on `cats` (lab: single writer, no txn).)
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
     * Logic — trả về toàn bộ mèo theo thứ tự id tăng (hợp đồng ổn định cho client/prom scrape).
     * Code — `find` với `order.id ASC` (SQL `ORDER BY id ASC`).
     * (EN Logic: Return all cats ordered by id ascending (stable API/metric contract).)
     * (EN Code: `find` with `order.id ASC` → SQL `ORDER BY id ASC`.)
     */
    async findAll(): Promise<CatEntity[]> {
        return this.cats.find({
            order: {
                id: "ASC",
            },
        })
    }

    /**
     * Logic — thêm mèo mới từ input đã validate; id do DB sinh sau `save`.
     * Code — `create` tạo entity chưa persist; `save` flush INSERT và trả entity có `id`.
     * (EN Logic: Append cat from validated input; DB assigns id after save.)
     * (EN Code: `create` builds unstaged entity; `save` runs INSERT and returns entity with `id`.)
     */
    async create(dto: CreateCatDto): Promise<CatEntity> {
        return this.cats.save(this.cats.create({
            name: dto.name,
            age: dto.age,
        }))
    }
}
