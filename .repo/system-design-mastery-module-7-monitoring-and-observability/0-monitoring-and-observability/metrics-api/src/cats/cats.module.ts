/**
 * Module miền mèo — TypeORM feature + controller REST `/cats`.
 * (EN: Cats domain module — TypeORM feature + REST `/cats` controller.)
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
} from "."

@Module({
    imports: [TypeOrmModule.forFeature([CatEntity])],
    controllers: [CatsController],
    providers: [CatsService],
})
/**
 * Class `CatsModule` — thành phần lab (controller/service/module).
 * (EN: Class `CatsModule` — lesson lab component.)
 */
export class CatsModule {}
