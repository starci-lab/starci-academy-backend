import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./crypto.module-definition"
import {
    EncryptionService
} from "./encryption.service"
import {
    Sha256Service
} from "./sha256.service"

@Module({
    providers: [
        EncryptionService,
        Sha256Service,
    ],
    exports: [
        EncryptionService,
        Sha256Service,
    ],
})
export class CryptoModule extends ConfigurableModuleClass {}
