/**
 * Cats domain module — TypeORM feature + REST `/cats` controller.
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    CatsController,
} from "."
import {
    CatsService,
} from "."
import {
    CatEntity,
} from "../entities"

@Module({
    imports: [TypeOrmModule.forFeature([CatEntity])],
    controllers: [CatsController],
    providers: [CatsService],
})
/**
 * Class `CatsModule` — lesson lab component.
 */
export class CatsModule {}
