const { write } = require("./gen-challenge")
const B = (vi, en) => ({ vi, en })
// helper to build a muted-structured requirement body
const reqBody = (purposeVi, purposeEn, consVi, consEn, hintVi, hintEn) => ({
  vi: `:::muted\nMục đích\n:::\n\n${purposeVi}\n\n:::muted\nRàng buộc kỹ thuật\n:::\n\n${consVi}\n\n:::muted\nGợi ý\n:::\n\n${hintVi}`,
  en: `:::muted\nPurpose\n:::\n\n${purposeEn}\n\n:::muted\nTechnical constraints\n:::\n\n${consEn}\n\n:::muted\nHint\n:::\n\n${hintEn}`,
})
const stepBody = (stepsVi, stepsEn, minVi, minEn, niceVi, niceEn) => ({
  vi: `:::muted\nCác bước thực hiện\n:::\n\n${stepsVi}\n\n:::muted\nYêu cầu tối thiểu cần đạt\n:::\n\n${minVi}\n\n:::muted\nNice to have\n:::\n\n${niceVi}`,
  en: `:::muted\nSteps\n:::\n\n${stepsEn}\n\n:::muted\nMinimum acceptance criteria\n:::\n\n${minEn}\n\n:::muted\nNice to have\n:::\n\n${niceEn}`,
})
const title = (vi, en) => B(vi, en)

const meta = {
  sortIndex: 1,
  difficulty: "easy",
  score: 100,
  title: B(
    "Dựng internal CA và bật mTLS hai chiều giữa hai service, chặn call thiếu cert ngay tại handshake",
    "Stand up an internal CA and enable two-way mTLS between two services, rejecting cert-less calls at the handshake"),
  description: B(
    "Dựng một internal CA cấp cert ngắn hạn rồi bật mutual TLS giữa hai service: service-b là mTLS server bắt buộc client cert hợp lệ, service-a là mTLS client trình client cert do CA ký. Chứng minh một call có cert được chấp nhận (200) trong khi một call không cert bị từ chối ngay tại tầng TLS — trước khi HTTP được đọc. Chọn ngôn ngữ bạn muốn; mọi ngôn ngữ trả về cùng một output contract.",
    "Stand up an internal CA that issues short-lived certs, then enable mutual TLS between two services: service-b is an mTLS server that requires a valid client cert, service-a is an mTLS client presenting a CA-signed client cert. Prove that a call with a cert is accepted (200) while a cert-less call is rejected at the TLS layer — before any HTTP is read. Pick whichever language you like; every language returns the same output contract."),
  requirements: [
    {
      score: 40,
      body: {
        typescript: {
          title: title("service-b: bật mTLS server bằng requestCert + rejectUnauthorized", "service-b: enable the mTLS server with requestCert + rejectUnauthorized"),
          body: reqBody(
            "Viết service-b bằng Node `https.createServer` với `requestCert: true` + `rejectUnauthorized: true`, nạp `ca.crt` làm `ca` để xác thực client cert; expose `GET /secure` trả về `caller` lấy từ CN của client cert.",
            "Write service-b with Node `https.createServer` using `requestCert: true` + `rejectUnauthorized: true`, loading `ca.crt` as `ca` to verify the client cert; expose `GET /secure` returning `caller` taken from the client cert CN.",
            "- Server phải dùng `key`/`cert` của chính service-b và `ca` = internal CA; không tin client cert do CA khác ký.\n- Lấy danh tính caller từ `socket.getPeerCertificate().subject.CN`, KHÔNG từ header do client tự khai.\n- service-b KHÔNG map cổng ra host (chỉ gọi được trong network).",
            "- The server must use service-b's own `key`/`cert` and `ca` = the internal CA; do not trust client certs signed by any other CA.\n- Derive the caller identity from `socket.getPeerCertificate().subject.CN`, NOT from a client-supplied header.\n- service-b must NOT publish its port to the host (reachable only inside the network).",
            "`rejectUnauthorized: true` khiến TLS huỷ handshake khi client không trình cert hợp lệ — request HTTP không bao giờ chạm handler. Đó là bằng chứng chốt chặn nằm ở tầng transport.",
            "`rejectUnauthorized: true` makes TLS abort the handshake when the client presents no valid cert — the HTTP request never reaches the handler. That proves the gate sits at the transport layer."),
        },
        java: {
          title: title("service-b: bật mTLS server bằng requestCert + rejectUnauthorized", "service-b: enable the mTLS server with requestCert + rejectUnauthorized"),
          body: reqBody(
            "Viết service-b (Spring Boot/`HttpsServer`) với `SSLContext` cấu hình `needClientAuth(true)`, trustStore = internal CA; expose `GET /secure` trả `caller` từ CN của client cert.",
            "Write service-b (Spring Boot/`HttpsServer`) with an `SSLContext` configured `needClientAuth(true)`, trustStore = the internal CA; expose `GET /secure` returning `caller` from the client cert CN.",
            "- Bật `client-auth: need` (Tomcat) hoặc `setNeedClientAuth(true)`; trustStore chỉ chứa internal CA.\n- Lấy CN từ `X509Certificate` của peer (`request.getAttribute(\"javax.servlet.request.X509Certificate\")`), KHÔNG từ header.\n- service-b KHÔNG map cổng ra host.",
            "- Enable `client-auth: need` (Tomcat) or `setNeedClientAuth(true)`; the trustStore contains only the internal CA.\n- Take the CN from the peer `X509Certificate` (`request.getAttribute(\"javax.servlet.request.X509Certificate\")`), NOT a header.\n- service-b must NOT publish its port to the host.",
            "Khi client không có cert, Tomcat từ chối tại handshake và servlet không bao giờ chạy — đó là điểm khác biệt cốt lõi so với check ở tầng application.",
            "When the client has no cert, Tomcat rejects at the handshake and the servlet never runs — that is the core difference from an application-layer check."),
        },
        csharp: {
          title: title("service-b: bật mTLS server bằng requestCert + rejectUnauthorized", "service-b: enable the mTLS server with requestCert + rejectUnauthorized"),
          body: reqBody(
            "Viết service-b (ASP.NET Core/Kestrel) với `ConfigureHttpsDefaults` đặt `ClientCertificateMode.RequireCertificate` và validate chuỗi cert theo internal CA; expose `GET /secure` trả `caller` từ CN.",
            "Write service-b (ASP.NET Core/Kestrel) with `ConfigureHttpsDefaults` setting `ClientCertificateMode.RequireCertificate` and validating the cert chain against the internal CA; expose `GET /secure` returning `caller` from the CN.",
            "- `ClientCertificateMode.RequireCertificate` + custom validation chỉ chấp nhận chain root = internal CA.\n- Lấy CN từ `HttpContext.Connection.ClientCertificate`, KHÔNG từ header.\n- service-b KHÔNG map cổng ra host.",
            "- `ClientCertificateMode.RequireCertificate` + custom validation that only accepts a chain rooting at the internal CA.\n- Take the CN from `HttpContext.Connection.ClientCertificate`, NOT a header.\n- service-b must NOT publish its port to the host.",
            "Đặt validation ở tầng TLS (Kestrel) thay vì middleware: client không cert bị chặn trước khi pipeline ASP.NET chạy.",
            "Put validation at the TLS layer (Kestrel) instead of middleware: a cert-less client is blocked before the ASP.NET pipeline runs."),
        },
        go: {
          title: title("service-b: bật mTLS server bằng requestCert + rejectUnauthorized", "service-b: enable the mTLS server with requestCert + rejectUnauthorized"),
          body: reqBody(
            "Viết service-b (Go `net/http` + `crypto/tls`) với `tls.Config{ ClientAuth: tls.RequireAndVerifyClientCert, ClientCAs: caPool }`; expose `GET /secure` trả `caller` từ CN của verified chain.",
            "Write service-b (Go `net/http` + `crypto/tls`) with `tls.Config{ ClientAuth: tls.RequireAndVerifyClientCert, ClientCAs: caPool }`; expose `GET /secure` returning `caller` from the verified chain CN.",
            "- `ClientAuth: RequireAndVerifyClientCert` và `ClientCAs` = pool chỉ có internal CA.\n- Lấy CN từ `r.TLS.VerifiedChains[0][0].Subject.CommonName`, KHÔNG từ header.\n- service-b KHÔNG map cổng ra host.",
            "- `ClientAuth: RequireAndVerifyClientCert` and `ClientCAs` = a pool containing only the internal CA.\n- Take the CN from `r.TLS.VerifiedChains[0][0].Subject.CommonName`, NOT a header.\n- service-b must NOT publish its port to the host.",
            "`RequireAndVerifyClientCert` buộc Go verify chain ngay khi bắt tay; handler chỉ chạy sau khi cert hợp lệ, nên `VerifiedChains` luôn có giá trị tin được.",
            "`RequireAndVerifyClientCert` forces Go to verify the chain during the handshake; the handler runs only after a valid cert, so `VerifiedChains` is always trustworthy."),
        },
      },
    },
    {
      score: 35,
      body: {
        typescript: {
          title: title("service-a: mTLS client trình cert, demo /call (200) vs /call-no-cert (bị từ chối)", "service-a: mTLS client presenting a cert, demo /call (200) vs /call-no-cert (rejected)"),
          body: reqBody(
            "Viết service-a (NestJS) gọi service-b qua `https.Agent` nạp `client.crt` + `client.key` + `ca.crt`. Expose `GET /call` (dùng agent có cert) và `GET /call-no-cert` (agent KHÔNG cert).",
            "Write service-a (NestJS) calling service-b via an `https.Agent` loading `client.crt` + `client.key` + `ca.crt`. Expose `GET /call` (using the cert-bearing agent) and `GET /call-no-cert` (an agent WITHOUT a cert).",
            "- `/call` phải trả 200 và in `caller=service-a` lấy từ service-b.\n- `/call-no-cert` phải thất bại ở handshake (lỗi TLS), service-a trả lỗi 502 rõ ràng — KHÔNG phải 200.\n- `ca.crt` được nạp để service-a tin server cert của service-b (chống MITM).",
            "- `/call` must return 200 and print `caller=service-a` taken from service-b.\n- `/call-no-cert` must fail at the handshake (TLS error); service-a returns a clear 502 — NOT 200.\n- `ca.crt` is loaded so service-a trusts service-b's server cert (anti-MITM).",
            "Hai endpoint khác nhau ĐÚNG một điểm: agent có hay không client cert. Cùng URL, cùng payload, chỉ khác cert — đó là cách cô lập biến để chứng minh mTLS là thứ quyết định.",
            "The two endpoints differ in EXACTLY one thing: whether the agent carries a client cert. Same URL, same payload, only the cert differs — that isolates the variable to prove mTLS is the deciding factor."),
        },
        java: {
          title: title("service-a: mTLS client trình cert, demo /call (200) vs /call-no-cert (bị từ chối)", "service-a: mTLS client presenting a cert, demo /call (200) vs /call-no-cert (rejected)"),
          body: reqBody(
            "Viết service-a (Spring Boot) gọi service-b bằng `HttpClient`/`RestTemplate` với `SSLContext` có keyManager = client cert + trustManager = internal CA. Expose `GET /call` và `GET /call-no-cert`.",
            "Write service-a (Spring Boot) calling service-b with `HttpClient`/`RestTemplate` using an `SSLContext` whose keyManager = the client cert and trustManager = the internal CA. Expose `GET /call` and `GET /call-no-cert`.",
            "- `/call` trả 200 + `caller=service-a`.\n- `/call-no-cert` dùng SSLContext KHÔNG keyManager → handshake fail → trả 502, KHÔNG 200.\n- trustManager chỉ tin internal CA.",
            "- `/call` returns 200 + `caller=service-a`.\n- `/call-no-cert` uses an SSLContext WITHOUT a keyManager → handshake fails → returns 502, NOT 200.\n- The trustManager trusts only the internal CA.",
            "Tạo hai `HttpClient`: một có keyManager (cert), một không — giữ mọi thứ khác giống hệt để chứng minh khác biệt đến từ client cert.",
            "Build two `HttpClient`s: one with a keyManager (cert), one without — keep everything else identical to prove the difference comes from the client cert."),
        },
        csharp: {
          title: title("service-a: mTLS client trình cert, demo /call (200) vs /call-no-cert (bị từ chối)", "service-a: mTLS client presenting a cert, demo /call (200) vs /call-no-cert (rejected)"),
          body: reqBody(
            "Viết service-a (ASP.NET Core) gọi service-b bằng `HttpClient` với `HttpClientHandler.ClientCertificates` thêm `X509Certificate2` (client cert). Expose `GET /call` và `GET /call-no-cert`.",
            "Write service-a (ASP.NET Core) calling service-b with an `HttpClient` whose `HttpClientHandler.ClientCertificates` adds an `X509Certificate2` (the client cert). Expose `GET /call` and `GET /call-no-cert`.",
            "- `/call` trả 200 + `caller=service-a`.\n- `/call-no-cert` dùng handler KHÔNG ClientCertificates → handshake fail → 502, KHÔNG 200.\n- Validate server cert theo internal CA (custom `ServerCertificateCustomValidationCallback`).",
            "- `/call` returns 200 + `caller=service-a`.\n- `/call-no-cert` uses a handler WITHOUT ClientCertificates → handshake fails → 502, NOT 200.\n- Validate the server cert against the internal CA (custom `ServerCertificateCustomValidationCallback`).",
            "Hai `HttpClient` khác nhau đúng ở việc có nạp `X509Certificate2` hay không; phần còn lại giữ nguyên để cô lập biến.",
            "Two `HttpClient`s differ only in whether an `X509Certificate2` is loaded; keep the rest identical to isolate the variable."),
        },
        go: {
          title: title("service-a: mTLS client trình cert, demo /call (200) vs /call-no-cert (bị từ chối)", "service-a: mTLS client presenting a cert, demo /call (200) vs /call-no-cert (rejected)"),
          body: reqBody(
            "Viết service-a (Go) gọi service-b bằng `http.Client` với `Transport.TLSClientConfig{ Certificates: []tls.Certificate{clientCert}, RootCAs: caPool }`. Expose `GET /call` và `GET /call-no-cert`.",
            "Write service-a (Go) calling service-b with an `http.Client` whose `Transport.TLSClientConfig{ Certificates: []tls.Certificate{clientCert}, RootCAs: caPool }`. Expose `GET /call` and `GET /call-no-cert`.",
            "- `/call` trả 200 + `caller=service-a`.\n- `/call-no-cert` dùng TLSClientConfig KHÔNG `Certificates` → handshake fail → 502, KHÔNG 200.\n- `RootCAs` = pool chỉ có internal CA.",
            "- `/call` returns 200 + `caller=service-a`.\n- `/call-no-cert` uses a TLSClientConfig WITHOUT `Certificates` → handshake fails → 502, NOT 200.\n- `RootCAs` = a pool containing only the internal CA.",
            "Hai transport khác nhau đúng ở field `Certificates`; giữ phần còn lại giống hệt để chứng minh client cert là yếu tố quyết định.",
            "Two transports differ only in the `Certificates` field; keep the rest identical to prove the client cert is the deciding factor."),
        },
      },
    },
    {
      score: 25,
      body: {
        typescript: {
          title: title("Đóng gói bằng Docker Compose + cert-init, viết README 6 phần với output THẬT", "Package with Docker Compose + cert-init, write a 6-section README with REAL output"),
          body: reqBody(
            "Ghép cert-init (one-shot sinh CA + cert), service-b và service-a vào một stack `docker compose`. Viết README 6 phần và dán output handshake THẬT cho cả hai kết cục.",
            "Wire cert-init (one-shot CA + cert generation), service-b and service-a into one `docker compose` stack. Write a 6-section README and paste the REAL handshake output for both outcomes.",
            "- `cert-init` chạy `openssl` sinh `ca.crt`, server cert (`CN=service-b`), client cert (`CN=service-a`) TTL ngắn (vd 1 ngày) vào volume `certs` dùng chung.\n- README đủ 6 phần (mô tả, cách chạy, kiến trúc/stack, smoke test, giải thích mTLS/handshake-reject, design decisions); Smoke Test dán output THẬT (`/call` 200 và `/call-no-cert` bị từ chối).\n- KHÔNG bịa output; cert ngắn hạn thể hiện tinh thần zero-trust.",
            "- `cert-init` runs `openssl` to generate `ca.crt`, a server cert (`CN=service-b`), and a client cert (`CN=service-a`) with a short TTL (e.g. 1 day) into a shared `certs` volume.\n- The README has all 6 sections (description, how to run, architecture/stack, smoke test, mTLS/handshake-reject explanation, design decisions); the Smoke Test pastes REAL output (`/call` 200 and `/call-no-cert` rejected).\n- Do NOT fabricate output; short-lived certs reflect the zero-trust spirit.",
            "Cert ngắn hạn ép hệ thống quen với việc rotate cert thường xuyên — một cert sống vĩnh viễn là phản pattern. Smoke test phải cho thấy `/call-no-cert` chết ở tầng TLS, không phải 200 rồi bị app chặn.",
            "Short-lived certs force the system to get used to frequent rotation — an everlasting cert is an anti-pattern. The smoke test must show `/call-no-cert` dying at the TLS layer, not a 200 later blocked by the app."),
        },
        java: {
          title: title("Đóng gói bằng Docker Compose + cert-init, viết README 6 phần với output THẬT", "Package with Docker Compose + cert-init, write a 6-section README with REAL output"),
          body: reqBody(
            "Ghép cert-init, service-b (Spring Boot) và service-a vào một stack `docker compose`. README 6 phần + output handshake THẬT.",
            "Wire cert-init, service-b (Spring Boot) and service-a into one `docker compose` stack. 6-section README + REAL handshake output.",
            "- `cert-init` sinh `ca.crt` + server/client cert (TTL ngắn) vào volume `certs`; cân nhắc keystore/truststore (PKCS12) cho JVM.\n- README đủ 6 phần; Smoke Test dán output THẬT (`/call` 200, `/call-no-cert` bị từ chối).\n- KHÔNG bịa output.",
            "- `cert-init` generates `ca.crt` + server/client certs (short TTL) into the `certs` volume; consider PKCS12 keystore/truststore for the JVM.\n- README has all 6 sections; the Smoke Test pastes REAL output (`/call` 200, `/call-no-cert` rejected).\n- Do NOT fabricate output.",
            "JVM cần keystore/truststore; script cert-init có thể đóng gói PEM thành PKCS12. Smoke test chứng minh chặn ở handshake.",
            "The JVM needs keystore/truststore; the cert-init script can package PEM into PKCS12. The smoke test proves rejection at the handshake."),
        },
        csharp: {
          title: title("Đóng gói bằng Docker Compose + cert-init, viết README 6 phần với output THẬT", "Package with Docker Compose + cert-init, write a 6-section README with REAL output"),
          body: reqBody(
            "Ghép cert-init, service-b (ASP.NET Core) và service-a vào một stack `docker compose`. README 6 phần + output handshake THẬT.",
            "Wire cert-init, service-b (ASP.NET Core) and service-a into one `docker compose` stack. 6-section README + REAL handshake output.",
            "- `cert-init` sinh `ca.crt` + server/client cert (TTL ngắn); cân nhắc `.pfx` cho .NET.\n- README đủ 6 phần; Smoke Test dán output THẬT (`/call` 200, `/call-no-cert` bị từ chối).\n- KHÔNG bịa output.",
            "- `cert-init` generates `ca.crt` + server/client certs (short TTL); consider `.pfx` for .NET.\n- README has all 6 sections; the Smoke Test pastes REAL output (`/call` 200, `/call-no-cert` rejected).\n- Do NOT fabricate output.",
            ".NET load cert qua `X509Certificate2` (PEM hoặc PFX). Smoke test phải cho thấy handshake-reject, không phải app-level 403.",
            ".NET loads certs via `X509Certificate2` (PEM or PFX). The smoke test must show a handshake reject, not an app-level 403."),
        },
        go: {
          title: title("Đóng gói bằng Docker Compose + cert-init, viết README 6 phần với output THẬT", "Package with Docker Compose + cert-init, write a 6-section README with REAL output"),
          body: reqBody(
            "Ghép cert-init, service-b (Go) và service-a vào một stack `docker compose`. README 6 phần + output handshake THẬT.",
            "Wire cert-init, service-b (Go) and service-a into one `docker compose` stack. 6-section README + REAL handshake output.",
            "- `cert-init` sinh `ca.crt` + server/client cert (TTL ngắn) vào volume `certs`; Go nạp PEM trực tiếp.\n- README đủ 6 phần; Smoke Test dán output THẬT (`/call` 200, `/call-no-cert` bị từ chối).\n- KHÔNG bịa output.",
            "- `cert-init` generates `ca.crt` + server/client certs (short TTL) into the `certs` volume; Go loads PEM directly.\n- README has all 6 sections; the Smoke Test pastes REAL output (`/call` 200, `/call-no-cert` rejected).\n- Do NOT fabricate output.",
            "Go nạp PEM bằng `tls.LoadX509KeyPair` + `x509.NewCertPool`. Smoke test chứng minh `/call-no-cert` chết ở TLS.",
            "Go loads PEM via `tls.LoadX509KeyPair` + `x509.NewCertPool`. The smoke test proves `/call-no-cert` dies at TLS."),
        },
      },
    },
  ],
  steps: [
    {
      body: Object.fromEntries(["typescript", "java", "csharp", "go"].map(l => [l, {
        title: title("Dựng internal CA và cấp cert ngắn hạn", "Stand up the internal CA and issue short-lived certs"),
        body: stepBody(
          "- **Bước 1:** Viết `gen-certs.sh` dùng `openssl` tạo internal CA (`ca.key`/`ca.crt`).\n- **Bước 2:** Cấp server cert `CN=service-b` và client cert `CN=service-a`, ký bằng CA, TTL ngắn (vd 1 ngày).\n- **Bước 3:** Ghi toàn bộ cert vào một volume `certs` để hai service cùng nạp.",
          "- **Step 1:** Write `gen-certs.sh` using `openssl` to create the internal CA (`ca.key`/`ca.crt`).\n- **Step 2:** Issue a server cert `CN=service-b` and a client cert `CN=service-a`, signed by the CA, short TTL (e.g. 1 day).\n- **Step 3:** Write all certs into a shared `certs` volume both services load.",
          "- `ca.crt`, server cert (`CN=service-b`), client cert (`CN=service-a`) tồn tại trong volume `certs`.\n- Cert có TTL ngắn, không phải vĩnh viễn.",
          "- `ca.crt`, the server cert (`CN=service-b`), and the client cert (`CN=service-a`) exist in the `certs` volume.\n- Certs have a short TTL, not forever.",
          "- Tham số hoá TTL và CN qua biến môi trường của cert-init.",
          "- Parameterize TTL and CN via cert-init environment variables."),
      }])),
    },
    {
      body: Object.fromEntries(["typescript", "java", "csharp", "go"].map(l => [l, {
        title: title("Viết service-b (mTLS server) và service-a (mTLS client)", "Write service-b (mTLS server) and service-a (mTLS client)"),
        body: stepBody(
          "- **Bước 1:** service-b bắt buộc client cert hợp lệ (verify theo CA) và trả `caller` từ CN.\n- **Bước 2:** service-a trình client cert khi gọi service-b; thêm endpoint `/call` (có cert) và `/call-no-cert` (không cert).\n- **Bước 3:** service-a tin server cert của service-b qua `ca.crt` (chống MITM).",
          "- **Step 1:** service-b requires a valid client cert (verified against the CA) and returns `caller` from the CN.\n- **Step 2:** service-a presents the client cert when calling service-b; add `/call` (with cert) and `/call-no-cert` (without cert).\n- **Step 3:** service-a trusts service-b's server cert via `ca.crt` (anti-MITM).",
          "- `/call` trả 200 với `caller=service-a`.\n- `/call-no-cert` bị từ chối ngay tại handshake (không phải 200).",
          "- `/call` returns 200 with `caller=service-a`.\n- `/call-no-cert` is rejected at the handshake (not a 200).",
          "- Log lý do handshake fail ở service-a để dễ debug.",
          "- Log the handshake failure reason in service-a for easier debugging."),
      }])),
    },
    {
      body: Object.fromEntries(["typescript", "java", "csharp", "go"].map(l => [l, {
        title: title("Chạy compose, thu output THẬT và viết README 6 phần", "Run compose, capture REAL output and write the 6-section README"),
        body: stepBody(
          "- **Bước 1:** `docker compose up` cả stack; gọi `/call` và `/call-no-cert`, lưu output terminal.\n- **Bước 2:** Giải thích VÌ SAO `/call-no-cert` chết ở tầng TLS (handshake) chứ không phải tầng app.\n- **Bước 3:** Viết README 6 phần và dán output THẬT của cả hai call.",
          "- **Step 1:** `docker compose up` the whole stack; hit `/call` and `/call-no-cert`, save the terminal output.\n- **Step 2:** Explain WHY `/call-no-cert` dies at the TLS layer (handshake), not the app layer.\n- **Step 3:** Write the 6-section README and paste the REAL output of both calls.",
          "- README đủ 6 phần; Smoke Test có output THẬT của `/call` (200) và `/call-no-cert` (bị từ chối).",
          "- README has all 6 sections; the Smoke Test has REAL output for `/call` (200) and `/call-no-cert` (rejected).",
          "- Một mermaid diagram: cert-init → service-a --mTLS--> service-b.",
          "- A mermaid diagram: cert-init → service-a --mTLS--> service-b."),
      }])),
    },
  ],
  outputs: [
    { text: B("Bạn dựng được một internal CA và cấp cert ngắn hạn cho service, hiểu vì sao danh tính do CA bảo chứng thay thế niềm tin dựa trên vị trí mạng.", "You can stand up an internal CA and issue short-lived service certs, understanding why CA-vouched identity replaces network-location trust.") },
    { text: B("Bạn bật được mutual TLS hai chiều: service-b bắt buộc và xác thực client cert, service-a trình cert hợp lệ khi gọi.", "You can enable two-way mutual TLS: service-b requires and verifies the client cert, and service-a presents a valid cert when calling.") },
    { text: B("Bạn chứng minh được việc chặn xảy ra ngay tại tầng TLS — call không cert bị huỷ ở handshake trước khi HTTP được đọc.", "You can prove the block happens at the TLS layer — a cert-less call is killed at the handshake before any HTTP is read.") },
  ],
  prerequisites: [
    { text: B("Đã đọc xong nội dung `2-mtls-zero-trust-service-auth`.", "Finished reading the `2-mtls-zero-trust-service-auth` content.") },
    { text: B("Hiểu cơ bản TLS một chiều (server cert) và khái niệm CA/chain-of-trust.", "Basic understanding of one-way TLS (server cert) and the CA/chain-of-trust concept.") },
    { text: B("Docker Desktop / Docker Engine + Compose plugin; runtime cho ngôn ngữ bạn chọn (Node 18+ / JDK 21 / .NET 8 / Go 1.22+) và `openssl`.", "Docker Desktop / Docker Engine + Compose plugin; the runtime for your chosen language (Node 18+ / JDK 21 / .NET 8 / Go 1.22+) and `openssl`.") },
  ],
}

write(meta, ".contexts/courses/1-system-design-mastery/modules/8-security-and-identity-management/contents/2-mtls-zero-trust-service-auth/challenges/0-mtls-internal-ca-handshake-easy")
