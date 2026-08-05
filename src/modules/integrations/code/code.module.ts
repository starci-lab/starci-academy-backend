
import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./code.module-definition"
import {
    OtpChallengeService 
} from "./otp-challenge.service"

@Module(
    {
        providers: [OtpChallengeService],
        exports: [OtpChallengeService],
    }
)
/**
 * Exposes {@link OtpChallengeService} so login/action OTP flows share one Redis
 * challenge store -- a second implementation would split attempt counters and TTL.
 */
export class CodeModule extends ConfigurableModuleClass {
}
