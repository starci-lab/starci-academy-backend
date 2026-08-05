import {
    Module,
} from "@nestjs/common"
import {
    FileStoreModule,
} from "../../file-store"
import {
    TusController,
} from "./tus.controller"

@Module({
    imports: [FileStoreModule],
    controllers: [TusController],
})
/** Leaf module for the resumable (tus protocol) upload lesson mock. */
export class TusMockModule {}
