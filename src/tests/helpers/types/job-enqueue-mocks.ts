/** A jest-backed stand-in for a job-enqueue service exposing a single `enqueue` call. */
export interface EnqueueJobMock {
    /** Enqueue call; asserted per-test. */
    enqueue: jest.Mock
}

/** A jest-backed stand-in for a job-enqueue service exposing a single `enqueueForTransaction` call. */
export interface EnqueueForTransactionJobMock {
    /** Enqueue-for-transaction call; asserted per-test. */
    enqueueForTransaction: jest.Mock
}
