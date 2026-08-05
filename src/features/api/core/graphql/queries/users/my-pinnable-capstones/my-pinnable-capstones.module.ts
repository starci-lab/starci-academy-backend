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
/** Feature-module boundary for the `myPinnableCapstones` query -- wires its resolver so the users group can mount this profile tab independently. */
export class MyPinnableCapstonesSingleQueryModule extends ConfigurableModuleClass {}
