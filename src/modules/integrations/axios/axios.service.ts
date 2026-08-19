import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Injectable
} from "@nestjs/common"
import axios, {
    AxiosInstance,
} from "axios"
import axiosRetry from "axios-retry"
import {
    AxiosCreateParams,
} from "./types/axios"
import {
    computeRetryDelayWithJitter,
} from "./utils/compute-retry-delay"

@Injectable()
/**
 * Service responsible for creating and managing Axios instances with retry logic.
 *
 * @example
 * const axiosService = new AxiosService()
 * const instance = axiosService.create({ key: "api", config: { baseURL: "https://api.example.com" } })
 */
export class AxiosService {
    private readonly axiosMap: Map<string, AxiosInstance> = new Map()
    
    /**
     * Creates or retrieves an Axios instance with retry logic.
     *
     * @param param - Parameters for creating the Axios instance
     * @returns Axios instance with retry logic configured
     *
     * @example
     * const instance = axiosService.create({ key: "api", config: { baseURL: "https://api.example.com" } })
     */
    create({ key, config }: AxiosCreateParams): AxiosInstance {
        // check if instance already exists for this key
        if (this.axiosMap.has(key)) {
            return this.axiosMap.get(key) as AxiosInstance
        }
        
        // create new Axios instance
        const axiosInstance = axios.create(config)
        
        // store instance in map
        this.axiosMap.set(
            key,
            axiosInstance,
        )
        
        // configure retry logic
        this.addRetry(axiosInstance)
        
        // return configured instance
        return axiosInstance
    } 
    
    /**
     * Configures retry logic for an Axios instance with exponential backoff and jitter.
     *
     * @param axiosInstance - Axios instance to configure retry for
     */
    private addRetry(
        axiosInstance: AxiosInstance
    ): void {
        // get retry configuration
        const maxRetries = envConfig().axios.retry.maxRetries
        
        // configure retry with exponential backoff and jitter
        axiosRetry(
            axiosInstance,
            {
                // set max retry attempts from config
                retries: maxRetries,
                // calculate delay with exponential backoff and jitter -- see
                // computeRetryDelayWithJitter for the formula and why it is
                // a standalone, unit-tested function rather than inlined here
                retryDelay: (retryCount) => computeRetryDelayWithJitter({
                    retryCount,
                    baseDelayMs: envConfig().axios.retry.delay,
                    jitterMaxMs: envConfig().axios.retry.delay,
                }),
                // determine if request should be retried
                retryCondition: (error) => {
                    // retry on network errors or idempotent request errors
                    const isNetworkError = axiosRetry.isNetworkOrIdempotentRequestError(error)
                    // extract response status for server error check
                    const { response } = error
                    const status = response?.status
                    // retry on server errors (5xx status codes)
                    const isServerError = Boolean(status && status >= 500)
                    return isNetworkError || isServerError
                },
            }
        )
    }
}