/**
 * HTTPS RPC URL → `wss://` twin so subscription clients reuse the same host
 * without a second config key that can drift from the HTTP endpoint.
 */
export const httpsToWss = (httpsUrl: string): string => {
    return httpsUrl.replace("https://",
        "wss://")
}

/**
 * True for native SUI in either short or 0-padded type form. Quote/swap paths
 * must treat both as the gas coin or they double-wrap / mis-price SUI.
 */
export const isSuiCoin = (type: string): boolean => {
    const suiCoinTypes = [
        "0x2::sui::SUI",
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    ].map(value => value.toLowerCase())
    if (suiCoinTypes.includes(type.toLowerCase())) {
        return true
    }
    return false
}

/**
 * True for the wrapped-SOL mint so routes unwrap to native SOL. Leaving WSOL
 * in the wallet means the user cannot pay fees on the next tx.
 */
export const isSolanaWrapped = (tokenAddress: string): boolean => {
    const wsolMintAddress = "So11111111111111111111111111111111111111112"
    if (tokenAddress.toLowerCase() === wsolMintAddress.toLowerCase()) {
        return true
    }
    return false
}