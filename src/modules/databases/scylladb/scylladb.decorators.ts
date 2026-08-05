import {
    Inject,
} from "@nestjs/common"
import {
    SCYLLADB_CLIENT,
} from "./constants/client"

/** Injects initialized shared ScyllaDB client into a provider. */
export const InjectScyllaDBClient = () => Inject(SCYLLADB_CLIENT)
