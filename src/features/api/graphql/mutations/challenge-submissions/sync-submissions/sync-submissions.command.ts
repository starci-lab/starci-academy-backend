import {
    SyncSubmissionsParams,
} from "./types"

export class SyncSubmissionsCommand {
    constructor(
        readonly params: SyncSubmissionsParams,
    ) {}
}
