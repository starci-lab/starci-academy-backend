/**
 * Kiểu response cho API CAP demo (balance / transfer / sync).
 * (EN: Response types for the CAP theorem demo API.)
 */

/** Snapshot số dư và metadata node. (EN: Balance snapshot and node metadata.) */
export interface BalanceResponse {
    balance: number
    nodeName: string
    servedBy: string
    mode: string
    timestamp: string
}

/** Kết quả chuyển tiền CP/AP. (EN: Transfer result under CP or AP mode.) */
export interface TransferResponse {
    status: string
    message: string
    newBalance: number
    duration: string
}

/** Kết quả đồng bộ nội bộ. (EN: Internal sync acknowledgement.) */
export interface SyncResponse {
    status: string
}
