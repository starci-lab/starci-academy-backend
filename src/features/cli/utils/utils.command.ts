import {
    Command, CommandRunner,
} from "nest-commander"
import {
    PgSyncCommand,
} from "./subs"
import {
    WinstonLog, WinstonService,
} from "@modules/winston"

@Command({
    name: "utils",
    description: "manage utils actions",
    subCommands: [ PgSyncCommand ],
})
export class UtilsCommand extends CommandRunner {
    constructor(
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    async run(): Promise<void> {
        this.winstonService.log(
            WinstonLog.CommandError,
            {
                message: "Please specify a subcommand, e.g. utils pg-sync --help",
            },
        )
        process.exit(1)
    }
}
