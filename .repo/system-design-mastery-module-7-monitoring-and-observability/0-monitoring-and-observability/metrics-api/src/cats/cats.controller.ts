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
     * Logic: List cats from Postgres.
     * Code: GET /cats → findAll.
     */
    @Get()
    findAll(): Promise<Array<CatEntity>> {
        return this.catsService.findAll()
    }

    /**
     * Logic: Create cat from request body.
     * Code: POST /cats → create.
     */
    @Post()
    create(@Body() body: CreateCatDto): Promise<CatEntity> {
        return this.catsService.create(body)
    }
}
