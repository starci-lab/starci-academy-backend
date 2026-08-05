import {
    Command, CommandRunner,
} from "nest-commander"
import {
    PgSyncCommand,
} from "./subs/pg-sync.command"
import {
    PlaygroundSeedTestCommand,
} from "./subs/playground-seed-test.command"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

@Command({
    name: "utils",
    description: "manage utils actions",
    subCommands: [
        PgSyncCommand,
        PlaygroundSeedTestCommand,
    ],
})
/**
 * Parent `utils` command that refuses to run bare -- exiting 0 here would look
 * successful. Forces operators to pick `pg-sync` or `playground-seed-test`.
 */
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
