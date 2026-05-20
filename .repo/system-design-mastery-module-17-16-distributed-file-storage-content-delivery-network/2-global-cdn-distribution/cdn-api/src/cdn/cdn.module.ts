import {
    Module,
} from "@nestjs/common"
import {
    CdnController,
} from "./cdn.controller"
import {
    CdnService,
} from "./cdn.service"

/**
 * Feature module cho bai hoc Phan phoi noi dung qua CDN toan cau.
 * (EN: Feature module for Global CDN Distribution.)
 */
@Module({
    controllers: [
        CdnController,
    ],
    providers: [
        CdnService,
    ],
    exports: [
        CdnService,
    ],
})
export class CdnModule {}
