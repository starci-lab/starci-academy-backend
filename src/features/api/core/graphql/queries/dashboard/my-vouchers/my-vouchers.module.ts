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
export class MyVouchersSingleQueryModule extends ConfigurableModuleClass {}
