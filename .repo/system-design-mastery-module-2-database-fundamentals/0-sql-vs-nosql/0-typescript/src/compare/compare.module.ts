/**
 * Nest feature module — registers controllers/services/providers for Compare.
 */
import {
    Module,
} from "@nestjs/common"
import {
    SqlModule,
} from "@0-sql-vs-nosql/sql/sql.module"
import {
    NosqlModule,
} from "@0-sql-vs-nosql/nosql/nosql.module"
import {
    CompareController,
} from "./compare.controller"
import {
    CompareService,
} from "./compare.service"

/**
 * Compare module — imports SqlModule and NosqlModule to use their services.
 */
@Module({
    imports: [
        SqlModule,
        NosqlModule,
    ],
    controllers: [CompareController],
    providers: [CompareService],
})
/**
 * Class `CompareModule` — lesson lab component.
 */
export class CompareModule {}
