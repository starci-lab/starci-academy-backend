import type {
    JobApplyMethod,
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import type {
    SubmitJobPostingRequest,
} from "../graphql-types/request"

/** Params for {@link import("../submit-job-posting.resolver").SubmitJobPostingResolver.validateCompanySelection}. */
export interface ValidateCompanySelectionParams {
    /** Id of an existing company, if the caller chose that path. */
    companyId?: string
    /** Inline new-company payload, if the caller chose that path. */
    newCompany: SubmitJobPostingRequest["newCompany"]
}

/** Params for {@link import("../submit-job-posting.resolver").SubmitJobPostingResolver.validateApplyMethod}. */
export interface ValidateApplyMethodParams {
    /** Discriminator for which apply target is required. */
    applyMethod: JobApplyMethod
    /** External apply URL, required when `applyMethod` is `ExternalUrl`. */
    applyUrl?: string
    /** Apply email, required when `applyMethod` is `Email`. */
    applyEmail?: string
}
