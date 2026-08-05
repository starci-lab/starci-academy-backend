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
/**
 * AES-GCM + SHA-256 providers so features encrypt/hash via DI instead of
 * reaching `node:crypto` with ad-hoc IVs and keys.
 */
export class CryptoModule extends ConfigurableModuleClass {}
