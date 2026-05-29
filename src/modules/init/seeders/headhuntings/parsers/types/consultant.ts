import type {
    ResolvedFilePath,
} from "../../../shared/path/types"

/** Ordinals locating `{company}/consultants/{consultantIndex}-{slug}/` on the mount. */
export interface ParseConsultantParams {
    paths: Array<ResolvedFilePath>
    consultantIndex: number
    companyIndex: number
}

/** Ordinals locating `{company}/consultants/` on the mount. */
export interface ParseConsultantManyParams {
    companyRelativePath: string
    companyIndex: number
}
