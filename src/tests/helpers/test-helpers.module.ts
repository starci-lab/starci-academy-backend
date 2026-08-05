import {
    Module,
} from "@nestjs/common"
import {
    HarnessInvokeService,
} from "./harness-invoke.service"
import {
    JudgeService,
} from "./judge.service"
import {
    ModelsService,
} from "./models.service"
import {
    PingResolver,
} from "./ping-resolver"
import {
    VolumeService,
} from "./volume.service"

@Module({
    providers: [
        ModelsService,
        JudgeService,
        VolumeService,
        HarnessInvokeService,
        PingResolver,
    ],
    exports: [
        ModelsService,
        JudgeService,
        VolumeService,
        HarnessInvokeService,
        PingResolver,
    ],
})
/**
 * Nest module that exposes the test-support helpers as providers for
 * `Test.createTestingModule({ imports: [TestHelpersModule] })`.
 *
 * Deliberately omitted:
 * - {@link E2eStackService} -- constructed inside Jest `globalSetup`, which
 *   runs in a different process from the specs. An injected copy would be a
 *   second, empty instance.
 * - {@link createE2eApp} -- the factory that *calls* `createTestingModule`; it
 *   cannot be a provider inside the module it builds.
 */
export class TestHelpersModule {}
