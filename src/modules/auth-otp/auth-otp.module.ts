import {
    Module,
} from "@nestjs/common"
import {
    IoRedisModule,
    IoRedisInstanceKey,
} from "@modules/native"
import {
    OtpChallengeService,
} from "./otp-challenge.service"

@Module({
    imports: [
        IoRedisModule.register({
            instanceKeys: [
                IoRedisInstanceKey.Cache,
            ],
        }),
    ],
    providers: [
        OtpChallengeService,
    ],
    exports: [
        OtpChallengeService,
    ],
})
export class AuthOtpModule {}

