import {
    Module,
} from "@nestjs/common"
import {
    FileStoreModule,
} from "../../file-store"
import {
    TusController,
} from "./tus.controller"

/** Leaf module for the resumable (tus protocol) upload lesson mock. */
@Module({
    imports: [FileStoreModule],
    controllers: [TusController],
})
export class TusMockModule {}
