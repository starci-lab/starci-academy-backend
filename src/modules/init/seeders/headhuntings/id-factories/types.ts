/**
 * Input for {@link HeadhuntingCompanyIdFactoryService.generate}.
 */
export interface GenerateHeadhuntingCompanyIdParams {
    /** Zero-based index of the company in the seeded list. */
    companyIndex: number
}

/**
 * Input for {@link ConsultantIdFactoryService.generate}.
 */
export interface GenerateConsultantIdParams {
    /** Zero-based company index (same as parent company folder). */
    companyIndex: number
    /** Zero-based headhunter index within that company. */
    consultantIndex: number
}
