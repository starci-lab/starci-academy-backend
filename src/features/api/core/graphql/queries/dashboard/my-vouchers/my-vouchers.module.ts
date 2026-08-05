import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-vouchers.module-definition"
import {
    MyVouchersResolver,
} from "./my-vouchers.resolver"

@Module({
    providers: [
        MyVouchersResolver,
    ],
})
/** Feature-module boundary for the `myVouchers` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyVouchersSingleQueryModule extends ConfigurableModuleClass {}
