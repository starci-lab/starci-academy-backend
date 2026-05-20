import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học Quorum consensus và xử lý xung đột.
 * (EN: Domain service for Quorum Consensus and Conflict Resolution.)
 */
@Injectable()
export class QuorumService {

    /**
     * Ghi dữ liệu vào replica và kiểm tra điều kiện quorum.
     * (EN: Writes data to replicas and checks quorum satisfaction.)
     */
    write(key: string, value: string, w: number, r: number) {
        const replicas = [
            { nodeId: "node-a", version: 8, accepted: true },
            { nodeId: "node-b", version: 8, accepted: true },
            { nodeId: "node-c", version: 7, accepted: false },
        ]
        const acknowledgements = replicas.filter((replica) => replica.accepted).length

        return {
            key,
            value,
            quorum: {
                n: replicas.length,
                w,
                r,
                satisfied: acknowledgements >= w,
            },
            acknowledgements,
            replicas,
            conflictResolution: "last-write-wins-demo",
        }
    }

}
