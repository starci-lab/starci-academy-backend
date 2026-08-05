/** Decision for a failed job: retry or cancel. */
export enum JobDecision {
    /** Re-queue the failure -- burns another BullMQ attempt/backoff cycle. */
    Retry = "Retry",
    /** Drop the job permanently -- downstream work never runs until a fresh enqueue. */
    Cancel = "Cancel",
}
