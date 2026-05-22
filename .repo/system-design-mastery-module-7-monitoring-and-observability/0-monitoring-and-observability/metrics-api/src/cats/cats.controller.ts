import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    CreateCatDto,
} from "./dto"
import {
    CatsService,
} from "./cats.service"
import {
    CatEntity,
} from "../entities"

/**
 * HTTP controller — REST `/cats` (lesson metrics-api).
 * (EN: HTTP controller — REST `/cats` (metrics-api lesson).)
 */
@Controller("cats")
export class CatsController {
    constructor(
        private readonly catsService: CatsService,
    ) {}

    /**
     * Logic — liệt kê mèo từ Postgres.
     * Code — GET /cats → CatsService.findAll.
     * (EN Logic: List cats from Postgres.)
     * (EN Code: GET /cats → findAll.)
     */
    @Get()
    findAll(): Promise<Array<CatEntity>> {
        return this.catsService.findAll()
    }

    /**
     * Logic — tạo mèo mới từ body.
     * Code — POST /cats + CreateCatDto → create.
     * (EN Logic: Create cat from request body.)
     * (EN Code: POST /cats → create.)
     */
    @Post()
    create(@Body() body: CreateCatDto): Promise<CatEntity> {
        return this.catsService.create(body)
    }
}
