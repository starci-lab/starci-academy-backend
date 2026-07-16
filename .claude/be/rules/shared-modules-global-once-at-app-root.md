# Rule — Module hạ tầng/dùng chung đăng ký GLOBAL đúng 1 LẦN ở app root; feature module KHÔNG import lại

**Mọi module hạ tầng/dùng chung (Langchain, Qdrant, Rag, Cache, Crypto, Filesystem, databases, Winston, Github, GoogleApis…) đăng ký `XModule.register({ isGlobal: true })` đúng 1 lần ở `apps/core/src/app.module.ts` — feature/processor/bussiness module KHÔNG `imports: [XModule]` lại, chỉ inject thẳng service nó export.**

- Đăng ký cùng 1 `ConfigurableModule` ở NHIỀU chỗ (app root + feature module + init module) → nhiều `DynamicModule`/provider trùng, khó lần — gom về đúng 1 lần ở app root.
- Cách kiểm 1 module đã global chưa: grep `XModule.register` ở `apps/*/src/app.module.ts` xem có `isGlobal: true`. Có → mọi `imports: [XModule]` ở feature module là thừa, xoá (kể cả `imports: []` mồ côi).
- Khác [[no-barrel-imports]] (BE version — cấm re-import module đã global, không phải cấm barrel export *).

> Đã áp thật ở BE: `apps/core/src/app.module.ts` (`AiModule.register`, `KafkaModule.register`, `CQRSModule.register`, `JwtModule.register`, `SocketIoFeatureModule.register`, `BackupModule.register`…). Sự cố 2026-07-01: `RagModule` bị import lẻ ở 5 feature module + `LangchainModule` thừa ở 1 module → gom về global 1 lần ở app root, bỏ 5+1 import thừa, tsc sạch.
> **Cross-link — nội dung đầy đủ ở** [[shared-modules-global-once-at-app-root]] (`.claude/fe/engineering/`) — rule THUẦN BACKEND (NestJS module wiring) lọt sang fe/ lúc dọn cây; bản chính ở đó (đã đủ chi tiết, không viết lại 2 lần).
