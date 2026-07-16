# Async & Messaging — hàng đợi · sự kiện · lịch (idiom THẬT)

Phạm vi: cách repo viết code **bất đồng bộ nền** — BullMQ (queue/worker/step), NATS + EventEmitter2 (sự kiện), `@Cron`/`@Interval` (lịch), Redis lock (coalesce), và discipline `async/await`/`Promise` trong service. Ground 100% từ `src/`; KHÔNG áp lý thuyết ngoài.

Ngăn xếp thật: `bullmq` + `@nestjs/bullmq` (queue), `nats` + `EventEmitter2` (bus kép), `ioredis` (lock/cache), `@nestjs/schedule` (`@Cron`/`@Interval`), `superjson` (serialize payload). KHÔNG có Kafka trong `src/` (chỉ ở hạ tầng CDC ngoài repo).

---

## 1. Queue name LUÔN từ `bullData[BullQueueName.X].name` — CẤM literal

Mọi queue được đặt tên tập trung tại `src/modules/bullmq/constants/queue.ts`. Inject queue + đăng ký worker phải trỏ vào đó, không gõ chuỗi tay.

✅ ĐÚNG — `src/modules/bussiness/jobs/enqueue/process-git-submission.service.ts`
```ts
@InjectQueue(bullData[BullQueueName.ProcessGitSubmission].name)
private readonly processGitSubmissionV2Queue: Queue<string>,
```

❌ SAI — `src/features/api/processors/ai/generate-cv/enqueue-generate-cv.service.ts` (nợ kỹ thuật, tự đánh dấu `TODO(wire)`)
```ts
// TODO(wire): swap the literal for
// `@InjectQueue(bullData[BullQueueName.GenerateCv].name)`.
@InjectQueue("generate-cv")
private readonly generateCvQueue: Queue<string>,
```
Thêm queue mới → thêm entry vào `bullData` (prefix `formatWithBraces` để pin Redis slot) + value vào enum `BullQueueName` TRƯỚC, rồi mới inject.

Payload qua ranh giới queue LUÔN là `string` → type `Queue<string>` / `Job<string>`, KHÔNG `Queue<MyPayload>`.

---

## 2. Enqueue = tracked-row-TRƯỚC, `add` fire-and-forget, có bù lỗi

Khuôn cố định ở mọi `enqueue/*.service.ts`: (1) persist row `jobs` (và row nghiệp vụ nếu có) TRƯỚC; (2) `void sleepEnqueueUxDelay().then(() => queue.add(...)).catch(...)` — KHÔNG `await` cú `add`, trả job về ngay; (3) `.catch` đánh dấu job `Failed` khi broker chết.

✅ ĐÚNG — `src/modules/bussiness/jobs/enqueue/process-git-submission.service.ts`
```ts
const job = await this.jobActionService.createJob({ /* … */ payload: this.superJson.stringify(payloadBody) })
void sleepEnqueueUxDelay().then(() =>
    this.processGitSubmissionV2Queue.add(job.id, job.payload, { jobId: job.id }),
).catch((error) =>
    this.jobActionService.failJob({ job, error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}` }),
)
```

❌ SAI — `await` cú add (chặn response), hoặc floating promise không `void`/không `.catch`:
```ts
await this.queue.add(job.id, job.payload)          // chặn UX vô cớ
this.queue.add(job.id, job.payload)                // floating promise, nuốt lỗi broker
```
`jobId: job.id` truyền vào options để BullMQ dedupe theo id ta kiểm soát (idempotent requeue). Delay lấy từ `sleepEnqueueUxDelay()` (`src/modules/bussiness/jobs/utils/enqueue-ux-delay.ts`) — đừng tự `setTimeout`.

---

## 3. Serialize payload qua queue = SuperJSON, không `JSON.stringify`

Payload chứa Date/BigInt… nên dùng `superjson` inject qua `@InjectSuperJson()`. `stringify` lúc enqueue, `parse<T>()` trong worker.

✅ ĐÚNG — enqueue `superJson.stringify(payloadBody)`; worker `src/features/api/processors/ai/generate-cv/generate-cv.worker.ts`
```ts
payload = this.superJson.parse<GenerateCvPayload>(bullmqJob.data)
```
Build payload theo lối **spread có điều kiện** để bỏ hẳn key `undefined` (giữ chuỗi serialize gọn):
```ts
...(branch !== undefined ? { branch } : {}),
```

---

## 4. Worker = `WorkerHost` + `@Processor`, một `process()`, try/catch trọn

Worker extends `WorkerHost`, decorate bằng `@Processor` (repo alias `Processor as Worker`) với concurrency/lock lấy từ `envConfig().bullmq.*`. Thân `process()` bọc try/catch: mark `processing` → chạy → `completeJob` + log Winston có cấu trúc; catch → mark `Failed` + log rồi **rethrow** (để BullMQ retry/backoff).

✅ ĐÚNG — `src/features/api/processors/ai/generate-cv/generate-cv.worker.ts`
```ts
@Worker(GENERATE_CV_QUEUE_NAME, {
    concurrency: envConfig().bullmq.aiConcurrency,
    lockDuration: envConfig().bullmq.lockDuration,
    stalledInterval: envConfig().bullmq.stalledInterval,
    maxStalledCount: envConfig().bullmq.maxStalledCount,
})
export class GenerateCvWorker extends WorkerHost {
    async process(bullmqJob: Job<string>) {
        try { /* … */ await this.jobActionService.completeJob({ job }) }
        catch (error) { /* markFailed + winston */ throw error }   // rethrow → retry
    }
}
```
Retry/backoff KHÔNG viết tay trong worker — cấu hình tập trung ở `BullModule.registerQueue` (`removeOnComplete/Fail: true`, `attempts`, `backoff: { type: "exponential", delay }`). Rethrow là cách kích hoạt nó.

---

## 5. Pipeline nhiều bước = `Map<number, AbstractStepService>` + vòng `while`

Job dài chia bước: mỗi bước 1 service `extends AbstractStepService<Payload, Extended>` (`src/modules/bussiness/jobs/types/context.ts`), gom vào `Map` keyed theo `stepIndex` trong `step-mapping.service.ts`. Worker lặp `while (job.currentStep < job.maxSteps)`, **re-fetch job mỗi vòng** rồi `step.process(context)`.

✅ ĐÚNG — `generate-cv.worker.ts`
```ts
while (job.currentStep < job.maxSteps) {
    const syncedJob = await this.jobActionService.getJob({ id: job.id })
    job = syncedJob; context.job = job
    const step = stepMap.get(syncedJob.currentStep)
    if (!step) { throw new StepNotFoundException({ stepIndex: syncedJob.currentStep }) }
    await step.process(context)
}
```
Không tìm thấy bước/row → throw AbstractException riêng (`StepNotFoundException`, `CvGenerationNotFoundException`), không `throw new Error`.

---

## 6. Sự kiện = `EventEmitterService.emit`, KHÔNG chạm thẳng EventEmitter2/NATS

Bus kép (local `EventEmitter2` + `NatsProducerService`) ẩn sau `EventEmitterService` (`src/modules/event/event-emitter.service.ts`). Chọn kênh qua `useLocal`/`useNats` từ `configMap[event]`. Không tự `nc.publish` hay `eventEmitter.emit` ở nơi khác.

✅ ĐÚNG — emit
```ts
await this.eventEmitterService.emit({ event: EventName.ChallengeSubmissionProgressUpdated, args, payload })
```

✅ ĐÚNG — subscribe trong `onModuleInit` — `src/features/api/core/graphql/queries/challenges/challenge-submission-progress/challenge-submission-progress.listener.ts`
```ts
export class ChallengeSubmissionProgressListener implements OnModuleInit {
    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.ChallengeSubmissionProgressUpdated,
            listener: async (payload: ChallengeSubmissionProgressUpdatedEventPayload) => { /* … */ },
        })
    }
}
```

❌ SAI — `console.log` payload trong luồng emit (nợ thật đang sót ở `event-emitter.service.ts` — đừng nhân bản):
```ts
if (useNats) {
    console.log({ eventName, payload })   // ❌ dùng WinstonService/Logger, không console.log
```
Log trong luồng nền = `WinstonService.log(WinstonLog.X, {...})` hoặc `new Logger(Class.name)`, có cấu trúc — không `console.*`.

---

## 7. Lịch = `@Cron`/`@Interval`, thân bọc try/catch nuốt lỗi (idempotent)

Việc định kỳ dùng decorator `@nestjs/schedule`. `@Cron` LUÔN đặt `name` + `timeZone: "Asia/Ho_Chi_Minh"`. Thân handler tự bọc try/catch **log-rồi-nuốt** — một run hỏng không được crash scheduler; job phải idempotent để hôm sau tự lành.

✅ ĐÚNG — `src/modules/bussiness/installment-plan/installment-plan-enforcement.cron.ts`
```ts
@Cron(CronExpression.EVERY_DAY_AT_1AM, { name: "installment-plan-enforcement", timeZone: "Asia/Ho_Chi_Minh" })
async enforceOverduePlans(): Promise<void> {
    try { /* find candidates → xử lý từng cái → log */ }
    catch (error) {
        const cause = error instanceof Error ? error : new Error(String(error))
        this.logger.error(cause.message, cause.stack)   // log + swallow
    }
}
```
Chu kỳ ngắn/kỹ thuật → `@Interval(envConfig().nats.ping.interval)` (`src/modules/event/nats/producer.service.ts`) — interval lấy từ env, không hardcode số.

Việc nặng phát hiện trong cron → **enqueue** cho worker, đừng xử lý nặng ngay trong tick (cron chỉ quét + dispatch).

---

## 8. `sleep` dùng helper chung; coalesce = Redis `SET NX` + poll

Chờ có chủ đích → `sleep(ms)` từ `@modules/common` (`src/modules/common/utils/sleep.ts`), không rải `new Promise(setTimeout)` khắp nơi. Chống bão request trùng across-instance → Redis lock `SET … PX … NX` + poll kết quả, `finally { del(lockKey) }`.

✅ ĐÚNG — `src/features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token-coalescer.service.ts`
```ts
const acquired = await this.redis.set(lockKey, "1", "PX", REFRESH_LOCK_TTL_MS, "NX")
if (acquired) { return this.exchangeAndPublish({ refreshToken, resultKey, lockKey }) }
// … else: await kết quả người giữ lock publish; timeout → tự exchange (correctness > dedup)
```
Lock LUÔN nhả trong `finally`; TTL (`PX`) làm van an toàn khi holder chết. Mọi hằng thời gian (`*_TTL_MS`, `*_INTERVAL_MS`) sống trong `constants/`, không magic-number.

---

## 9. Promise discipline — CẤM floating promise

- Fire-and-forget cố ý → **luôn** `void promise.then(...).catch(...)` (mục 2). Không bao giờ để promise trôi trần.
- Chạy song song đã biết số → `Promise.all([...])`; cần từng phần dù có cái fail → `Promise.allSettled` (repo dùng có chủ đích, hiếm). Vòng lặp tuần tự cần thứ tự/áp lực DB → `for … of` + `await` (như cron mục 7 duyệt `duePlans`), không `forEach(async …)`.
- Mọi hàm async khai báo `Promise<T>` tường minh ở public method (khớp `type-safety.md`), không để suy ra `Promise<void>` ngầm ở boundary.
