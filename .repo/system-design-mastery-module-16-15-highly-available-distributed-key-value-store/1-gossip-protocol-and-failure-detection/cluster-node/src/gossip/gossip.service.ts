import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học Gossip protocol và phát hiện lỗi.
 * (EN: Domain service for Gossip Protocol and Failure Detection.)
 */
@Injectable()
export class GossipService {

    /**
     * Trả về trạng thái node từ failure detector mô phỏng.
     * (EN: Returns node state from the simulated failure detector.)
     */
    nodes() {
        return {
            protocol: "gossip",
            fanout: 3,
            nodes: [
                { nodeId: "node-a", status: "alive", heartbeat: 42 },
                { nodeId: "node-b", status: "alive", heartbeat: 41 },
                { nodeId: "node-c", status: "suspect", heartbeat: 35 },
            ],
            failureDetector: "phi-accrual-demo",
        }
    }

}
