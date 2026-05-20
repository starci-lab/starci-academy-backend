import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học Change Data Capture với Debezium.
 * (EN: Domain service for Change Data Capture with Debezium.)
 */
@Injectable()
export class CdcService {

    private readonly events = [
        { offset: 101, table: "products", op: "c", key: "sku_100", indexed: true },
        { offset: 102, table: "products", op: "u", key: "sku_101", indexed: true },
    ]

    /**
     * Trả về snapshot consumer để kiểm tra luồng CDC sang search index.
     * (EN: Returns a consumer snapshot to verify the CDC-to-search-index flow.)
     */
    eventsSnapshot() {
        return {
            connector: "debezium-postgres-demo",
            consumerGroup: "search-indexer",
            lag: 0,
            events: this.events,
        }
    }

}
