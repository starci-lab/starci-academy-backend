
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
export class CodeModule extends ConfigurableModuleClass {
}
