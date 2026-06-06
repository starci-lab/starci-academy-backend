import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mutations.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    MutationsController,
} from "./mutations.controller"

/** Leaf module for the mutations + invalidation-graph lesson mock. */
@Module({
    imports: [StoreModule],
    controllers: [MutationsController],
})
export class MutationsModule extends ConfigurableModuleClass {}
