import {
    Module,
} from "@nestjs/common"
import {
    CdcController,
} from "./cdc.controller"
import {
    CdcService,
} from "./cdc.service"

/**
 * Feature module cho bài học Change Data Capture với Debezium.
 * (EN: Feature module for Change Data Capture with Debezium.)
 */
@Module({
    controllers: [
        CdcController,
    ],
    providers: [
        CdcService,
    ],
    exports: [
        CdcService,
    ],
})
export class CdcModule {}
