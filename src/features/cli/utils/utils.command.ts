import {
    Command, CommandRunner,
} from "nest-commander"
import {
    PgSyncCommand,
    PlaygroundSeedTestCommand,
} from "./subs"
import {
    WinstonLog, WinstonService,
} from "@modules/winston"

@Command({
    name: "utils",
    description: "manage utils actions",
    subCommands: [
        PgSyncCommand,
        PlaygroundSeedTestCommand,
    ],
})
/**
 * Parent `utils` command that refuses to run bare — exiting 0 here would look
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
