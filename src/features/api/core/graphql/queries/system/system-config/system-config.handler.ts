import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    SystemConfigQuery,
} from "./system-config.query"
import {
    SystemConfigData,
} from "./graphql-types"

@QueryHandler(SystemConfigQuery)
@Injectable()
export class SystemConfigHandler
    extends ICQRSHandler<SystemConfigQuery, SystemConfigData>
    implements IQueryHandler<SystemConfigQuery, SystemConfigData>
{
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) {
        super()
    }

    protected override async process(
    ): Promise<SystemConfigData> {
        return this.mountFilesystemService.appConfig().systemConfig
    }
}
