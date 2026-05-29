# 09 — CQRS Event Bus + NATS

Hai cơ chế "event" khác nhau, đừng nhầm:
- **CQRS event bus** (`@modules/cqrs`, `@nestjs/cqrs`) — in-process, có retry, để decouple side-effect (gửi mail, sync store…).
- **NATS** (`@modules/event`) — cross-service pub/sub qua subject.

## CQRS event bus (`src/modules/cqrs/event-bus/`)
Mỗi event = 1 folder:
```
send-mail/
├─ send-mail.event.ts     # class event chứa payload
├─ send-mail.handler.ts   # handler xử lý
└─ index.ts
```

### Handler pattern
```ts
@Injectable()
@EventsHandler(SendMailEvent)
export class SendMailEventHandler
    extends ICQRSHandler<SendMailEvent, void>
    implements ICommandHandler<SendMailEvent, void> {
    private readonly logger = new Logger(SendMailEventHandler.name)

    constructor(private readonly enqueueSendMailJobService: EnqueueSendMailJobService) {
        super()
    }

    protected override async process(event: SendMailEvent): Promise<void> {
        await this.enqueueSendMailJobService.enqueue(event.payload)
    }
}
```
- Extend `ICQRSHandler<Event, Result>` (`src/modules/cqrs/icqrs-handler.ts`) + implement `ICommandHandler` — override `process()` (KHÔNG `execute()`; wrapper bọc retry quanh `process`).
- Publish: `eventBus.publish(new SendMailEvent(payload))` từ domain/feature service.
- Handler có sẵn (folder): `add-github-user-to-team`, `send-mail`, `sync-cdn`, `sync-elasticsearch`, `sync-cassandra`, `sync-mongodb`, `sync-scylladb`.

### ⚠️ Double-register (cố ý — đừng xóa)
`apps/core/src/app.module.ts` có cả `CqrsModule.forRoot()` (Nest core) **và** `CQRSModule.register({ isGlobal: true })` (wrapper riêng bổ sung event bus custom). Cần cả hai.

## NATS (`src/modules/event/`)
- Subject khai trong enum `EventName` (`src/modules/event/enums/`).
- ⚠️ Thêm subject mới phải làm **2 chỗ**: (1) add vào `EventName`, (2) khai trong `EventModule.register({ nats: { subjects: [...] } })` ở `apps/core/src/app.module.ts`. Quên 1 → không subscribe.

## Chọn cơ chế nào
| Nhu cầu | Dùng |
|---------|------|
| Side-effect nội bộ, decouple, retry | CQRS event bus |
| Việc nặng/async, có queue | BullMQ job (xem 10) |
| Pub/sub giữa các service/app | NATS |
