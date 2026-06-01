# Khôi phục Quorum Key của Kani — Trò cần gì?

> Tài liệu này giải thích cơ chế ký giao dịch bằng **key quorum (Privy)** trong dự án
> [`starci-lab/kani`](https://github.com/starci-lab/kani) + hạ tầng
> [`starci-lab/kani-k8s`](https://github.com/starci-lab/kani-k8s), và **liệt kê đầy đủ
> những thứ phải có để khôi phục lại quyền ký cho ví của một con bot.**

---

## 1. Bức tranh tổng quát: "quorum key" là gì trong Kani?

Mỗi ví bot trên Privy **không** do một key duy nhất điều khiển, mà do một **Key Quorum**
gồm **2 public key** (xem `privy-core.service.ts` → `createSigner()`):

```
Key Quorum của 1 bot
├── (1) Public key của BOT      ← sinh riêng từng bot: generateP256KeyPair()
└── (2) Public key của SERVER   ← chung toàn hệ thống: appConfig.privy.signer.publicKey
```

Khi ký giao dịch (`privy-sign.service.ts`), code đưa vào **cả 2 private key tương ứng**:

```ts
authorization_context: {
  authorization_private_keys: [
    this.mountStorageService.privySignerPrivateKey,   // (2) server signer private key
    privySignerPrivateKey,                            // (1) bot private key (đã giải mã)
  ],
}
```

👉 **Nghĩa là: muốn ký/khôi phục quyền điều khiển ví của 1 bot, trò phải có ĐỦ CẢ HAI:**
- **Private key riêng của bot đó** (mỗi bot một cái, được lưu **đã mã hóa**), và
- **Private key signer của server** (dùng chung cho mọi bot).

Thiếu một trong hai → không ký được → coi như mất quyền điều khiển ví.

---

## 2. Private key của bot được cất ở đâu? (và mã hóa thế nào)

Lúc tạo bot (`create-bot-v2.service.ts`):

1. Sinh cặp khóa P256: `keyPair = generateP256KeyPair()` → `{ publicKey, privateKey }`.
2. **Mã hóa** private key bằng AES‑256‑GCM:
   `encryptedPrivySignerPrivateKeyPayload = derivedAesKeyService.encrypt(keyPair.privateKey)`
   → ra payload `{ iv, authTag, ciphertext }` (đều base64).
3. Lưu payload đã mã hóa vào **2 nơi (backup kép)**:

| Nơi lưu | Vị trí cụ thể | Ghi chú |
|---|---|---|
| **MongoDB** | collection `bots`, field `encryptedPrivySignerPrivateKeyPayload` | kèm `privyMetadata.{ walletId, signerPublicKey, walletPublicKey }` và `accountAddress` |
| **Google Drive** | folder `Keys`, file `<botId>.json` | nội dung là payload mã hóa, stringify bằng `superjson` — đây là **bản backup** |

> ⚠️ Cả 2 nơi chỉ chứa **bản đã mã hóa**. Tự nó vô dụng nếu không có **khóa AES dẫn xuất** ở mục 3.

---

## 3. Khóa AES để giải mã được dẫn xuất ra sao? (đây là chỗ then chốt)

Xem `derived-aes-key-service.service.ts` → `onModuleInit()`. Khóa AES không nằm sẵn ở
đâu cả, mà **được dựng lại lúc app khởi động** qua 3 bước:

```
encrypted-aes-key (file mount, base64)
        │  ① giải mã bằng Google Cloud KMS
        ▼
raw key material
        │  ② PBKDF2(raw, SALT_AES_CBC, 100000 vòng, 32 byte, sha256)
        ▼
DERIVED AES KEY  ──③──►  AES-256-GCM decrypt payload bot  ──►  private key bot (plaintext)
```

Chi tiết từng đầu vào:

- **① KMS**: gọi `GcpKmsService.decrypt({ ciphertext: encryptedAesKey })`.
  - Key KMS: keyring `kani-crypto-keyring`, crypto key `kani-crypto-key` (xem
    `kani-k8s/scripts/create-crypto-key-encryptor-decryptor-sa.sh`), tại `location` của GCP project.
  - Tên đầy đủ lấy từ `appConfig.cryptoKeyName` (mount qua `.mount/config/app.json`).
  - Cần Service Account `crypto-key-ed-sa` có role `roles/cloudkms.cryptoKeyEncrypterDecrypter`.
- **② PBKDF2 params** (cố định, trong `derived/constants`): `100_000` vòng, độ dài `32` byte, digest `sha256`.
  - **Salt** = env `SALT_AES_CBC` (mặc định trong code là `ZsOM7sCx0UemrdC3gsi2q6NRQLb7TCsI`,
    **nhưng prod thường override** → phải lấy đúng giá trị prod).
- **③** Giải mã AES‑256‑GCM với `{ iv, authTag, ciphertext }` từ mục 2.

> 🔴 **KMS key = gốc niềm tin (root of trust).** Nếu `kani-crypto-key` bị xóa/hủy trong GCP,
> thì `encrypted-aes-key` không giải được → **mọi private key bot mất vĩnh viễn**. Đây là thứ
> phải bảo vệ và backup cẩn thận nhất.

---

## 4. ✅ Checklist: TRÒ CẦN GÌ để khôi phục quorum key của 1 bot

Gom đủ **toàn bộ** các thành phần sau (thiếu 1 là không khôi phục được):

### A. Phần dữ liệu riêng của bot
- [ ] **Payload private key đã mã hóa** của bot — lấy từ **một trong hai**:
  - MongoDB: `bots.encryptedPrivySignerPrivateKeyPayload` của bot cần khôi phục, **hoặc**
  - Google Drive: file `Keys/<botId>.json`.
- [ ] **`walletId`** của bot (trong `bots.privyMetadata.walletId`) — để gọi Privy ký.
- [ ] (tham khảo) `accountAddress`, `signerPublicKey`, `walletPublicKey` để đối chiếu.

### B. Phần để dựng lại KHÓA AES dẫn xuất (mục 3)
- [ ] File **`encrypted-aes-key`** (secret `encrypted-aes-key` / mount `.mount/terraform/...`, base64).
- [ ] **Quyền truy cập GCP KMS**: file SA JSON `crypto-key-ed-sa.json`
      (hoặc `gcp-cloud-kms-crypto-operator-sa`) **CÒN HIỆU LỰC**.
- [ ] **KMS key vẫn còn tồn tại** trong GCP: keyring `kani-crypto-keyring`, key `kani-crypto-key`,
      đúng `location` + đúng `appConfig.cryptoKeyName`.
- [ ] Giá trị **`SALT_AES_CBC`** đúng như môi trường đã mã hóa (lấy từ env/secret prod).
- [ ] Tham số PBKDF2: `100000` vòng / `sha256` / `32` byte (đã cố định trong code — chỉ cần biết).

### C. Phần signer chung của server (nửa còn lại của quorum)
- [ ] **Private key signer của server**: secret `privy-signer-private-key`
      (mount `.mount/terraform/privy-signer-private-key.key`).
- [ ] **Thông tin app Privy**: `PRIVY_APP_ID` + secret `privy-app-secret-key` — để gọi được Privy API.

> Tóm gọn 3 cụm: **(A) payload bot** + **(B) bộ giải mã AES = KMS + encrypted-aes-key + salt**
> + **(C) signer server + credential Privy**. Đủ cả 3 mới ký lại được.

---

## 5. Quy trình khôi phục (các bước thực thi)

1. **Lấy payload mã hóa** của bot từ Mongo hoặc từ `Keys/<botId>.json` (Google Drive).
   - Nếu lấy từ Drive: `superjson.parse(...)` để ra `{ iv, authTag, ciphertext }`.
2. **Dựng lại khóa AES dẫn xuất**:
   a. Đọc file `encrypted-aes-key` (base64 → Buffer).
   b. Dùng SA KMS gọi `KMS.decrypt` trên `kani-crypto-keyring/kani-crypto-key` → ra `raw key`.
   c. `pbkdf2Sync(raw, SALT_AES_CBC, 100000, 32, "sha256")` → **derived AES key**.
3. **Giải mã payload**: AES‑256‑GCM `decrypt({ iv, authTag, ciphertext }, derivedKey)`
   → ra **private key P256 của bot** (plaintext).
4. **Ghép quorum để ký**: đưa vào Privy `authorization_private_keys = [ server_signer_private_key, bot_private_key ]`,
   gọi `wallets().solana().signTransaction(...)` (Solana) hoặc `wallets().rawSign(...)` (Sui) với `walletId`.
5. Ví đã ký được → quyền điều khiển được khôi phục. (Có thể rút quỹ về `withdrawalAddress` nếu cần.)

> Có thể dựng lại bằng chính code Kani (`DerivedAesKeyService` + `PrivySignService`) với
> mount đầy đủ secret, hoặc viết 1 script độc lập tái hiện đúng 3 bước trên.

---

## 6. Ma trận rủi ro: mất cái gì thì sao?

| Mất / hỏng | Hậu quả | Còn cứu được không? |
|---|---|---|
| Mongo bot record | Mất payload + `walletId` ở DB | ✅ nếu còn backup Google Drive `Keys/<botId>.json` |
| Google Drive `Keys/` | Mất bản backup payload | ✅ nếu Mongo còn `encryptedPrivySignerPrivateKeyPayload` |
| **KMS key `kani-crypto-key`** | Không dựng lại được khóa AES | ❌ **MẤT TOÀN BỘ private key mọi bot** |
| `encrypted-aes-key` file | Không có ciphertext để KMS giải | ❌ trừ khi có backup file này |
| `SALT_AES_CBC` sai/mất | PBKDF2 ra khóa sai → giải mã fail | ❌ phải đúng salt prod |
| `privy-signer-private-key` | Thiếu nửa quorum của server | ❌ không đủ chữ ký để ký |
| Privy app secret / app id | Không gọi được Privy API | ❌ không ký được |

**Kết luận cho thầy:** thứ tối quan trọng phải backup ngoài luồng là **(1) KMS key `kani-crypto-key`**,
**(2) file `encrypted-aes-key`**, **(3) `SALT_AES_CBC`**, **(4) `privy-signer-private-key`** và
**(5) credential Privy**. Có 5 thứ đó cộng với payload bot (Mongo *hoặc* Drive) là khôi phục được toàn bộ.

---

### Phụ lục — file/nguồn tham chiếu trong repo

- `kani/src/modules/privy/privy-core.service.ts` — tạo quorum + ví (`createSigner`, `createWallet`).
- `kani/src/modules/privy/privy-sign.service.ts` — ghép 2 private key để ký.
- `kani/src/features/interface/graphql/mutations/bot/create-bot-v2/create-bot-v2.service.ts` — mã hóa + lưu Mongo + upload Drive.
- `kani/src/modules/derived/derived-aes-key-service.service.ts` — dẫn xuất khóa AES (KMS → PBKDF2).
- `kani/src/modules/crypto/encryption.service.ts` — AES‑256‑GCM encrypt/decrypt.
- `kani/src/modules/gcp/gcp-kms.service.ts` — gọi Google Cloud KMS.
- `kani/src/modules/filesystem/utils/mount-secrets.ts` — đọc các secret từ mount.
- `kani-k8s/terraform/do/modules/kubernetes/_global_resources_secret_mount.tf` — định nghĩa các K8s secret (`encrypted-aes-key`, `privy-signer-private-key`, `privy-app-secret-key`, các SA...).
- `kani-k8s/scripts/create-crypto-key-encryptor-decryptor-sa.sh` — tạo KMS keyring/key + SA encrypt/decrypt.
