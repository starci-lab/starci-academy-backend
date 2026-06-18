import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-pinnable-capstones.module-definition"
import {
    MyPinnableCapstonesResolver,
} from "./my-pinnable-capstones.resolver"

@Module({
    providers: [
        MyPinnableCapstonesResolver,
    ],
})
export class MyPinnableCapstonesSingleQueryModule extends ConfigurableModuleClass {}
