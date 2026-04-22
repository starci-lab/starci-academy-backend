import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./socketio.module-definition"
import {
    AutocompleteModule 
} from "./autocomplete"

/**
 * Feature module bundling all real-time Socket.IO gateways of the app.
 *
 * - `/autocomplete`  namespace: Elasticsearch-powered autocomplete.
 */
@Module({
    imports: [
        AutocompleteModule.register({
            isGlobal: true,
        }),
    ],
})
export class SocketIoModule extends ConfigurableModuleClass {}
