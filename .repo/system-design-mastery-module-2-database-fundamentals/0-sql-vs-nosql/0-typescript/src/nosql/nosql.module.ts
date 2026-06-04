/**
 * Nest feature module — registers controllers/services/providers for NoSQL.
 */
import {
    Module,
} from "@nestjs/common"
import {
    MongooseModule,
} from "@nestjs/mongoose"
import {
    Product,
    ProductSchema,
} from "./schemas/product.schema"
import {
    NosqlController,
} from "./nosql.controller"
import {
    NosqlService,
} from "./nosql.service"

/**
 * NoSQL module — MongooseModule.forFeature to inject Model<ProductDocument>.
 */
@Module({
    imports: [
                // Register Product schema to enable Model injection.
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
        ]),
    ],
    controllers: [NosqlController],
    providers: [NosqlService],
    exports: [NosqlService],
})
/**
 * Class `NosqlModule` — lesson lab component.
 */
export class NosqlModule {}
