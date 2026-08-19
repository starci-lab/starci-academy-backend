import {
    createAdapter,
} from "@socket.io/redis-adapter"
import type {
    Server,
} from "socket.io"

import {
    ServerOptions 
} from "node:http"
import {
    RedisClient,
} from "@modules/lib/native/redis/types/client"
import {
    IoAdapter 
} from "@nestjs/platform-socket.io"

/**
 * Shares Socket.IO rooms across pods via Redis pub/sub -- without it, room emits stay local
 * to one instance.
 */
export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>
    private redisClient: RedisClient
    private adapterClients: Array<RedisClient> = []

    public setClient(redisClient: RedisClient) {
        this.redisClient = redisClient
    }

    public async connect(): Promise<void> {
        const pubClient = this.redisClient.duplicate()
        const subClient = this.redisClient.duplicate()
        await Promise.all(
            [
                pubClient.connect(),
                subClient.connect(),
            ]
        )
        this.adapterConstructor = createAdapter(
            pubClient,
            subClient
        )
        // These clients are created by this adapter, so this adapter must also
        // close them. Otherwise graceful app shutdown leaves reconnect loops
        // alive and a broker restart becomes an unhandled process error.
        this.adapterClients = [
            pubClient,
            subClient,
        ]
    }

    public createIOServer(
        port: number, 
        options?: ServerOptions
    ) {
        const server = super.createIOServer(port,
            options)
        server.adapter(this.adapterConstructor)
        return server
    }

    /** Close Socket.IO and every Redis connection owned by this adapter. */
    public override async close(server: Server): Promise<void> {
        await super.close(server)
        const clients = this.adapterClients
        this.adapterClients = []
        await Promise.allSettled(clients.map(async (client) => {
            if (client.isOpen) {
                await client.quit()
            }
        }))
    }
}
