import {
    Test,
} from "@nestjs/testing"
import {
    Global,
    Inject,
    Injectable,
    Module,
} from "@nestjs/common"
import {
    OAuthStateModule,
} from "./oauth-state.module"
import {
    OAuthStateService,
} from "./oauth-state.service"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"

@Injectable()
class OAuthStateConsumer {
    constructor(
        @Inject(OAuthStateService)
        readonly service: OAuthStateService,
    ) {}
}

@Module({
    providers: [OAuthStateConsumer],
})
class ConsumerModule {}

@Global()
@Module({
    providers: [
        {
            provide: createIoRedisKey(IoRedisInstanceKey.Cache),
            useValue: {
            },
        },
    ],
    exports: [createIoRedisKey(IoRedisInstanceKey.Cache)],
})
class RedisStubModule {}

/** Keeps OAuth state visible to sibling capabilities only when the root makes it global. */
describe("OAuthStateModule",
    () => {
        it("shares OAuthStateService with a sibling module when registered globally",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [
                        RedisStubModule,
                        OAuthStateModule.register({
                            isGlobal: true,
                        }),
                        ConsumerModule,
                    ],
                })
                    .compile()

                expect(moduleRef.get(OAuthStateConsumer).service)
                    .toBe(moduleRef.get(OAuthStateService))
                await moduleRef.close()
            })
    })
