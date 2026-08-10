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
    PingResolver,
} from "./ping-resolver"
import {
    GitMountService,
} from "./git-mount.service"
import {
    winstonServiceMock,
} from "./create-e2e-app"
import {
    E2eDbResetService,
} from "./e2e-db-reset.service"

@Module({
    providers: [
        JudgeService,
        GitMountService,
        HarnessInvokeService,
        PingResolver,
        E2eDbResetService,
        winstonServiceMock,
    ],
    exports: [
        JudgeService,
        GitMountService,
        HarnessInvokeService,
        PingResolver,
        E2eDbResetService,
        winstonServiceMock.provide,
    ],
})
/**
 * Nest module that exposes the test-support helpers as providers for
 * `Test.createTestingModule({ imports: [TestHelpersModule] })`.
 *
 * It also carries the {@link winstonServiceMock}: nearly every service in the
 * app logs through `WinstonService`, whose real implementation injects three
 * Winston loggers and one Loki transport. Providing the stub here means a spec
 * that imports this module never has to know that, and never opens a network
 * transport just to assert on a row.
 *
 * Deliberately omitted:
 * - {@link E2eStackService} -- constructed inside Jest `globalSetup`, which
 *   runs in a different process from the specs. An injected copy would be a
 *   second, empty instance.
 * - {@link createE2eApp} -- the factory that *calls* `createTestingModule`; it
 *   cannot be a provider inside the module it builds.
 */
export class TestHelpersModule {}
