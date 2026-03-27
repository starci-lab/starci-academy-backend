import {
    AxiosService,
} from "@modules/axios"
import {
    envConfig,
} from "@modules/env"
import {
    ServiceUnavailableException,
} from "@nestjs/common"
import {
    AxiosError,
} from "axios"

const AXIOS_KEY_PAYOS = "payos-merchant"

export function assertPayosMerchantConfigured(): void {
    const c = envConfig().payos
    if (!c.clientId || !c.apiKey || !c.checksumKey) {
        throw new ServiceUnavailableException(
            "PayOS merchant credentials are not configured (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)",
        )
    }
}

export function createPayosMerchantAxios(
    axiosService: AxiosService,
) {
    const cfg = envConfig().payos
    const base = cfg.baseUrl.replace(
        /\/$/,
        "",
    )
    return axiosService.create(
        {
            key: AXIOS_KEY_PAYOS,
            config: {
                baseURL: base,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": cfg.apiKey,
                    "x-client-id": cfg.clientId,
                    ...(cfg.partnerCode
                        ? {
                            "x-partner-code": cfg.partnerCode,
                        }
                        : {}),
                },
            },
        },
    )
}

export function rethrowPayosAxiosError(
    message: string,
    unknownError: unknown,
): never {
    if (unknownError instanceof AxiosError) {
        const status = unknownError.response?.status
        const data = unknownError.response?.data
        throw new ServiceUnavailableException(
            {
                message,
                status,
                data,
            },
        )
    }
    throw unknownError
}
