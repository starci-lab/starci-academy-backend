import {
    INestApplication 
} from "@nestjs/common"

export {}

declare global {
  var __APP__: INestApplication
}

declare module "kafkajs/src/network/requestQueue" {
  /**
   * KafkaJS's per-connection request queue. Deep internal import -- the package
   * publishes no types for it, so this shim declares only the surface the
   * negative-timeout guard in
   * `@modules/integrations/kafka/request-queue-throttle-patch` touches.
   */
  class RequestQueue {
    constructor(options: {
      maxInFlightRequests: number | null
      requestTimeout: number
      enforceRequestTimeout: boolean
      clientId: string
      broker: string
      logger: Record<"debug" | "info" | "warn" | "error", (...args: Array<unknown>) => void>
      instrumentationEmitter?: unknown
      isConnected?: () => boolean
    })
    /** Requests waiting on in-flight capacity or on a throttle window to close. */
    pending: Array<unknown>
    /**
     * ms-since-epoch when broker-side throttling ends, or the sentinel `-1`
     * while the queue has never been throttled.
     */
    throttledUntil: number
    /** Handle of the armed pending-request check; null when none is armed. */
    throttleCheckTimeoutId: NodeJS.Timeout | null
    /** Drains what capacity allows, then re-arms the pending-request check. */
    checkPendingRequests(): void
    /** Arms the timer that will re-run {@link checkPendingRequests}. */
    scheduleCheckPendingRequests(): void
    /** Clears the queue's timers. */
    destroy(): void
  }
  export = RequestQueue
}

declare module "html-to-docx" {
  /**
   * Converts an HTML string to a .docx document buffer. (CommonJS default
   * export; no bundled types -- this ambient shim covers the call we use.)
   */
  const HTMLtoDOCX: (
    htmlString: string,
    headerHTMLString?: string | null,
    documentOptions?: Record<string, unknown>,
    footerHTMLString?: string | null,
  ) => Promise<Buffer | ArrayBuffer>
  export default HTMLtoDOCX
}