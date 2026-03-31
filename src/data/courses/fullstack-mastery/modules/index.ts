import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
} from "@modules/databases"
import {
    fullstackMasteryModule1,
} from "./1"
import {
    fullstackMasteryModule2,
} from "./2"

/** Module seeds in display order (folder `1`, `2`, …). */
export const fullstackMasteryModules: Array<DeepPartial<ModuleEntity>> = [
    fullstackMasteryModule1,
    fullstackMasteryModule2,
]
