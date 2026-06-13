# 2-devops-mastery / 0-linux-and-cli-fundamentals
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Linux, Shell]
**Question:** A cron job runs `backup.sh > backup.log` but when it fails the log is empty. The errors are clearly printed on the terminal when you run it by hand. Why is the log empty, and how do you capture everything?
**Verdict:** KEEP — diagnosis question with a real "why" (stream separation) plus a follow-up on cron environment; scales junior→senior.

### New answer (en)
**TL;DR** — `>` only redirects **stdout** (fd 1). The errors go to **stderr** (fd 2), which is still attached to the terminal, so they never land in the file. Capture both with `backup.sh > backup.log 2>&1`.

**How it works** — `2>&1` means "make fd 2 point wherever fd 1 currently points," so it must come *after* `> backup.log` — order matters. Bash also has the shorthand `&> backup.log`. Use `>>` instead of `>` if you want to append across runs rather than truncate each time.

:::muted
**Trade-off** — Merging both streams into one file gives a complete record but you lose the ability to grep errors separately. For a noisy job, keep them split with `> backup.log 2> backup.err`. For long-running services, prefer not redirecting to a flat file at all — let `systemd`/the container runtime capture the streams so they rotate and stay queryable via `journalctl`.
:::

:::muted
**Common pitfall** — `backup.sh 2>&1 > backup.log` (wrong order) sends stderr to the *terminal* and only stdout to the file — the exact bug reversed. And under `cron` the working directory and `$PATH` differ from your interactive shell, so a script that "works by hand" fails with command-not-found; if you didn't capture stderr you'd never see why.
:::

*Go deeper — how would you make the same script's failures page you, not just sit in a log file nobody reads?*

**Keywords** — `stdout · stderr · fd 1 · fd 2 · 2>&1 · &> · journalctl`

### New answer (vi)
**Chốt** — `>` chỉ redirect **stdout** (fd 1). Lỗi đi ra **stderr** (fd 2), vốn vẫn gắn với terminal, nên không bao giờ tới được file. Bắt cả hai bằng `backup.sh > backup.log 2>&1`.

**Cơ chế** — `2>&1` nghĩa là "cho fd 2 trỏ tới nơi fd 1 đang trỏ," nên nó phải nằm *sau* `> backup.log` — thứ tự rất quan trọng. Bash còn có cú pháp tắt `&> backup.log`. Dùng `>>` thay vì `>` nếu muốn ghi nối tiếp qua nhiều lần chạy thay vì ghi đè mỗi lần.

:::muted
**Trade-off** — Gộp cả hai stream vào một file cho bản ghi đầy đủ nhưng mất khả năng grep riêng phần lỗi. Với job sinh nhiều output, hãy tách: `> backup.log 2> backup.err`. Với service chạy lâu, tốt nhất đừng redirect ra file phẳng — để `systemd`/container runtime bắt các stream để chúng rotate và truy vấn được qua `journalctl`.
:::

:::muted
**Bẫy thường gặp** — `backup.sh 2>&1 > backup.log` (sai thứ tự) đẩy stderr ra *terminal* và chỉ stdout vào file — đúng cái bug bị đảo ngược. Và dưới `cron`, thư mục làm việc và `$PATH` khác với shell tương tác, nên script "chạy tay thì được" lại lỗi command-not-found; nếu không bắt stderr thì không bao giờ thấy lý do.
:::

*Đào sâu tiếp — làm sao để lỗi của chính script này page cho bạn, thay vì chỉ nằm im trong một file log không ai đọc?*

**Từ khoá ăn điểm** — `stdout · stderr · fd 1 · fd 2 · 2>&1 · &> · journalctl`

## 1-card — middle — [Linux, Permissions]
**Question:** After `git clone`, running `./deploy.sh` fails with `Permission denied`, but `bash deploy.sh` works fine. The file clearly exists. What is happening, and what does `ls -l` tell you?
**Verdict:** KEEP — diagnosis of execute-bit vs read, plus octal/symbolic trade-off and a `chmod 777` security pitfall; genuinely middle-level.

### New answer (en)
**TL;DR** — `./deploy.sh` asks the kernel to **execute** the file, which needs the **execute bit** (`x`); `bash deploy.sh` only needs **read** because bash interprets the script as data. The file is missing `x` — `chmod +x deploy.sh` fixes it.

**How it works** — `ls -l deploy.sh` shows the mode string, e.g. `-rw-r--r--`: owner/group/other, each `rwx`. No `x` anywhere means not executable; `chmod +x` makes it `-rwxr-xr-x`. To make the bit survive the next clone, commit it with `git update-index --chmod=+x deploy.sh` — Git tracks the executable bit but not full Unix permissions.

:::muted
**Trade-off** — `chmod +x` grants execute to owner, group **and** other at once (modified by `umask`). For tighter control use octal: `chmod 750 deploy.sh` = `rwxr-x---`. Octal is explicit and idempotent — preferred in provisioning — whereas symbolic `+x`/`-w` edits are relative to the current mode: handy interactively but non-deterministic in automation.
:::

:::muted
**Common pitfall** — Reflexively running `chmod 777` to "make it work" is a real security hole: any user on the box can then modify and execute the file — a classic privilege-escalation foothold. Also, the execute bit means different things by type: on a **directory** `x` grants the right to *enter* (`cd`) and access files by name, not to "run" it — a dir with `r` but no `x` lets you list names yet not open anything inside.
:::

*Go deeper — your CI checks out the repo but the deploy still fails on the exec bit; where in the pipeline did the bit get lost?*

**Keywords** — `execute bit · ls -l · chmod +x · umask · octal 750 · git update-index --chmod`

### New answer (vi)
**Chốt** — `./deploy.sh` yêu cầu kernel **execute** file, cần **execute bit** (`x`); `bash deploy.sh` chỉ cần quyền **read** vì bash thông dịch script như dữ liệu. File thiếu `x` — `chmod +x deploy.sh` là sửa được.

**Cơ chế** — `ls -l deploy.sh` hiện chuỗi mode, ví dụ `-rw-r--r--`: owner/group/other, mỗi nhóm `rwx`. Không có `x` ở đâu nghĩa là không executable; `chmod +x` biến nó thành `-rwxr-xr-x`. Để bit sống sót qua lần clone sau, commit nó bằng `git update-index --chmod=+x deploy.sh` — Git track execute bit nhưng không track toàn bộ permission Unix.

:::muted
**Trade-off** — `chmod +x` cấp execute cho owner, group **và** other cùng lúc (bị `umask` điều chỉnh). Muốn chặt hơn thì dùng octal: `chmod 750 deploy.sh` = `rwxr-x---`. Octal tường minh và idempotent — ưu tiên trong provisioning — trong khi chỉnh symbolic `+x`/`-w` là tương đối so với mode hiện tại: tiện khi gõ tay nhưng không tất định trong tự động hóa.
:::

:::muted
**Bẫy thường gặp** — Theo phản xạ chạy `chmod 777` để "cho nó chạy" là một lỗ hổng bảo mật thật: bất kỳ user nào trên máy đều có thể sửa và execute file — bàn đạp leo thang đặc quyền kinh điển. Ngoài ra, execute bit mang nghĩa khác nhau tùy loại: trên một **thư mục**, `x` cấp quyền *đi vào* (`cd`) và truy cập file theo tên, không phải "chạy" nó — thư mục có `r` nhưng không có `x` cho liệt kê tên nhưng không mở được gì bên trong.
:::

*Đào sâu tiếp — CI checkout repo nhưng deploy vẫn fail vì exec bit; ở đâu trong pipeline cái bit bị mất?*

**Từ khoá ăn điểm** — `execute bit · ls -l · chmod +x · umask · octal 750 · git update-index --chmod`

## 2-card — senior — [Linux, Networking, Debugging]
**Question:** `systemctl status api` shows the service `active (running)`, but a client on another machine gets `Connection refused` on port 8080. The process is clearly up. How do you find out why nobody can reach it?
**Verdict:** KEEP — strong senior triage: bind-address vs firewall, refused-vs-timeout split, container loopback trap. Real design reasoning.

### New answer (en)
**TL;DR** — "Running" only means the process is alive, not reachable. Check what it's actually listening on with `ss -tlnp` — a `127.0.0.1:8080` local address means it bound to **loopback only** and must bind `0.0.0.0:8080` instead.

**How it works** — `ss -tlnp` = TCP, listening, numeric, with PID; the decisive column is the local address. If it already shows `0.0.0.0:8080` and is still refused, the packet isn't reaching the socket: check the host firewall (`iptables -L -n` / `nft list ruleset` / `ufw status`) and, in the cloud, the **security group / network ACL**. `Connection refused` (RST) means *something* answered "nothing here" — versus a *timeout*, which points to a firewall silently dropping packets.

:::muted
**Trade-off** — Binding `0.0.0.0` is the quick fix but exposes the port on every interface; safer is to bind a specific internal interface, or keep `127.0.0.1` and front it with a reverse proxy (nginx/Caddy) that terminates TLS and is the only thing exposed. "Refused vs timeout" is the single most useful triage split: refused → app/port/binding (you reached the host); timeout → routing/firewall/security-group (you didn't).
:::

:::muted
**Common pitfall** — Inside containers a process bound to `127.0.0.1` is unreachable even with `-p 8080:8080`, because the published port forwards to the container's external interface, not loopback. Another trap: `curl localhost:8080` *on the server* succeeds (loopback works) and masks the bind bug until a real remote client fails — always reproduce from where the client actually lives.
:::

*Go deeper — `ss` shows `0.0.0.0:8080`, the host firewall is open, but a remote client still times out; what's your next hop?*

**Keywords** — `ss -tlnp · 127.0.0.1 vs 0.0.0.0 · bind address · RST vs timeout · security group · iptables/nft`

### New answer (vi)
**Chốt** — "Running" chỉ nghĩa là process còn sống, không phải kết nối được tới. Kiểm tra nó đang listen ở đâu bằng `ss -tlnp` — local address `127.0.0.1:8080` nghĩa là nó bind **chỉ loopback** và phải bind `0.0.0.0:8080` thay vào đó.

**Cơ chế** — `ss -tlnp` = TCP, listening, numeric, kèm PID; cột quyết định là local address. Nếu nó đã hiện `0.0.0.0:8080` mà vẫn refused, gói tin không tới được socket: kiểm tra firewall của host (`iptables -L -n` / `nft list ruleset` / `ufw status`) và, trên cloud, **security group / network ACL**. `Connection refused` (RST) nghĩa là *có gì đó* trả lời "ở đây không có" — khác với *timeout*, vốn chỉ tới một firewall đang lặng lẽ drop gói.

:::muted
**Trade-off** — Bind `0.0.0.0` là cách sửa nhanh nhưng phơi port ra mọi interface; an toàn hơn là bind một interface nội bộ cụ thể, hoặc giữ `127.0.0.1` và đặt một reverse proxy (nginx/Caddy) phía trước để terminate TLS và là thứ duy nhất phơi ra. "Refused vs timeout" là cách chia triage hữu ích nhất: refused → app/port/binding (đã tới được host); timeout → routing/firewall/security-group (chưa tới được).
:::

:::muted
**Bẫy thường gặp** — Trong container, process bind `127.0.0.1` thì không reachable kể cả khi có `-p 8080:8080`, vì published port forward tới interface ngoài của container, không phải loopback. Bẫy khác: `curl localhost:8080` *trên chính server* lại thành công (loopback chạy được), che mất bug bind cho tới khi một client từ xa thật sự fail — luôn tái hiện từ đúng nơi client thực sự nằm.
:::

*Đào sâu tiếp — `ss` hiện `0.0.0.0:8080`, firewall host mở, nhưng client từ xa vẫn timeout; chặng tiếp theo bạn kiểm tra là gì?*

**Từ khoá ăn điểm** — `ss -tlnp · 127.0.0.1 vs 0.0.0.0 · bind address · RST vs timeout · security group · iptables/nft`

## 3-card — senior — [Linux, Storage, Debugging]
**Question:** `df -h` says `/` is 100% full and writes are failing, but `du -sh /*` adds up to only a fraction of the disk. Where did the space go, and how do you reclaim it without rebooting?
**Verdict:** KEEP — classic deleted-but-open-fd diagnosis with df/du divergence, inode exhaustion follow-up; genuinely senior.

### New answer (en)
**TL;DR** — The classic cause is a **deleted-but-still-open file**: a process (often a logger) holds an open fd to a file someone `rm`'d, so its blocks stay allocated. `du` can't see it (the directory entry is gone) but `df` still counts it. Find it with `lsof +L1`.

**How it works** — The inode and its blocks survive until the last fd closes, which is why `df` and `du` disagree. `lsof +L1` lists files with link-count 0; `lsof -nP | grep deleted` works too. Reclaim instantly without killing the process by truncating through `/proc`: `: > /proc/<pid>/fd/<n>`. The clean fix is to restart (or signal-reload) the holder, then fix the root cause — usually a service logging with no rotation.

:::muted
**Trade-off** — Truncating via `/proc/<pid>/fd` frees space *now* without a restart, but you lose that log and the app keeps writing to the same (now-empty) fd — a stopgap, not a fix. Restarting is cleaner but costs availability. The durable answer is `logrotate` with `copytruncate` or a proper `SIGHUP` reopen, plus shipping logs off-box so the root filesystem never fills from logs at all.
:::

:::muted
**Common pitfall** — `df` can also report 100% when **inodes** are exhausted while bytes are free — millions of tiny files (mail queues, session files) run out of inodes first; check `df -i`. And running `du` as a non-root user silently skips unreadable directories, making the total look smaller and sending you after the wrong directory — do disk forensics as root, and remember `du` measures *allocated* blocks, which differ from apparent size for sparse files.
:::

*Go deeper — `lsof +L1` shows nothing and `df -i` is fine, yet `/` is still full; where else can the space be hiding?*

**Keywords** — `lsof +L1 · deleted fd · /proc/pid/fd · df vs du · df -i (inodes) · logrotate copytruncate`

### New answer (vi)
**Chốt** — Nguyên nhân kinh điển là một **file đã xóa nhưng vẫn đang mở**: một process (thường là logger) giữ fd mở tới file mà ai đó đã `rm`, nên các block của nó vẫn được cấp phát. `du` không thấy (directory entry mất rồi) nhưng `df` vẫn đếm. Tìm bằng `lsof +L1`.

**Cơ chế** — Inode và các block của nó sống tới khi fd cuối cùng đóng, đó là vì sao `df` và `du` lệch nhau. `lsof +L1` liệt kê file có link-count 0; `lsof -nP | grep deleted` cũng được. Thu hồi tức thì mà không kill process bằng cách truncate qua `/proc`: `: > /proc/<pid>/fd/<n>`. Cách sửa sạch là restart (hoặc signal-reload) process đang giữ, rồi sửa gốc rễ — thường là một service ghi log không có rotation.

:::muted
**Trade-off** — Truncate qua `/proc/<pid>/fd` giải phóng dung lượng *ngay* mà không cần restart, nhưng bạn mất log đó và app vẫn ghi tiếp vào cùng fd (giờ rỗng) — giải pháp tạm, không phải fix. Restart sạch hơn nhưng tốn availability. Câu trả lời bền vững là `logrotate` với `copytruncate` hoặc `SIGHUP` reopen đúng cách, cộng với đẩy log ra khỏi máy để root filesystem không bao giờ đầy vì log.
:::

:::muted
**Bẫy thường gặp** — `df` cũng có thể báo 100% khi **inode** cạn trong khi byte vẫn còn — hàng triệu file nhỏ (mail queue, session file) làm cạn inode trước; kiểm tra `df -i`. Và chạy `du` dưới user không phải root sẽ lặng lẽ bỏ qua thư mục không đọc được, khiến tổng trông nhỏ hơn và làm bạn truy đuổi nhầm thư mục — điều tra ổ đĩa với quyền root, và nhớ `du` đo các block *được cấp phát*, vốn khác kích thước hiển thị với sparse file.
:::

*Đào sâu tiếp — `lsof +L1` không thấy gì và `df -i` vẫn ổn, mà `/` vẫn đầy; dung lượng còn có thể ẩn ở đâu?*

**Từ khoá ăn điểm** — `lsof +L1 · deleted fd · /proc/pid/fd · df vs du · df -i (inodes) · logrotate copytruncate`

## 4-card — senior — [Linux, Performance, Debugging]
**Question:** An alert fires: load average is 16 on a 4-core box and the API is slow. Walk me through your triage from `ssh` to a root cause. Does load average 16 always mean the CPU is the bottleneck?
**Verdict:** KEEP — open-ended triage walkthrough; load-average-is-not-CPU is a deep senior concept with strace/perf trade-offs.

### New answer (en)
**TL;DR** — No — load average counts processes **runnable *or* in uninterruptible sleep (D state, usually I/O)**, so 16 on 4 cores does *not* automatically mean CPU-bound. Start at `top`/`htop` and read the `%us`/`%sy`/`%wa`/`%id` line to see what's actually saturated.

**How it works** — High `%wa` (iowait) → disk/network is the bottleneck; high `%us` → genuine compute; high `%sy` → kernel/syscall storm. Sort by CPU to find the offending PID, then drill in: `ps -eo pid,stat,wchan,cmd` to spot processes stuck in `D`, `pidstat 1` to watch per-process CPU/IO over time, and `strace -p <pid>` / `perf top` to see *what* it's doing. Correlate the spike with a deploy, a cron job, or a traffic surge.

:::muted
**Trade-off** — `strace` pauses the target on every syscall and can noticeably slow a hot process — fine for triage, dangerous on a latency-critical service under load. Reach for sampling tools (`perf top`, `pidstat`) first and use `strace` only when you need the exact syscall. Also weigh "kill the runaway now to restore service" against "capture a thread dump / core first to root-cause later" — you usually get one shot at the live state.
:::

:::muted
**Common pitfall** — Treating load average as a CPU metric is the classic mistake: a box stuck on NFS or a dying disk shows load 50 with CPUs nearly idle (`%id` high, `%wa` high) — adding cores fixes nothing. The other trap is averaging away the spike: the 15-minute load looks fine while the 1-minute number is screaming. Compare all three windows and correlate with per-second tools, because a 30-second GC pause or lock storm vanishes in any average.
:::

*Go deeper — `%wa` is high and a process sits in `D` state on disk I/O; how do you tell whether it's a slow disk, a saturated disk, or an NFS mount stalling?*

**Keywords** — `load avg = runnable + D state · %us/%sy/%wa/%id · iowait · pidstat · perf top · strace · 1/5/15-min windows`

### New answer (vi)
**Chốt** — Không — load average đếm các process **runnable *hoặc* đang uninterruptible sleep (trạng thái D, thường là I/O)**, nên 16 trên 4 nhân *không* tự động nghĩa là CPU-bound. Bắt đầu ở `top`/`htop` và đọc dòng `%us`/`%sy`/`%wa`/`%id` để xem thứ gì đang thật sự bão hòa.

**Cơ chế** — `%wa` (iowait) cao → disk/network là nút thắt; `%us` cao → tính toán thật; `%sy` cao → bão syscall/kernel. Sort theo CPU để tìm PID gây lỗi, rồi đào sâu: `ps -eo pid,stat,wchan,cmd` xem process có kẹt ở `D` không, `pidstat 1` để theo dõi CPU/IO từng process theo thời gian, và `strace -p <pid>` / `perf top` để xem nó *đang làm gì*. Đối chiếu cú spike với một lần deploy, một cron job, hay một đợt traffic tăng đột biến.

:::muted
**Trade-off** — `strace` dừng tiến trình đích ở mỗi syscall và có thể làm chậm rõ rệt một process đang nóng — ổn khi triage, nguy hiểm trên một service nhạy latency đang chịu tải. Ưu tiên công cụ sampling (`perf top`, `pidstat`) trước và chỉ dùng `strace` khi cần đúng syscall cụ thể. Cũng cân nhắc giữa "kill ngay tiến trình lồng để khôi phục dịch vụ" và "lấy thread dump / core trước để root-cause sau" — thường chỉ có một cơ hội với trạng thái live.
:::

:::muted
**Bẫy thường gặp** — Coi load average như một metric CPU là sai lầm kinh điển: một máy kẹt NFS hay đĩa đang hỏng hiện load 50 trong khi CPU gần như rảnh (`%id` cao, `%wa` cao) — thêm nhân chẳng sửa được gì. Bẫy còn lại là trung bình hóa mất cú spike: load 15 phút trông ổn trong khi con số 1 phút đang gào. Luôn so cả ba cửa sổ thời gian và đối chiếu với công cụ theo từng giây, vì một GC pause 30 giây hay lock storm sẽ biến mất trong mọi giá trị trung bình.
:::

*Đào sâu tiếp — `%wa` cao và một process ngồi ở trạng thái `D` chờ disk I/O; làm sao phân biệt đĩa chậm, đĩa bão hòa, hay một NFS mount đang treo?*

**Từ khoá ăn điểm** — `load avg = runnable + D state · %us/%sy/%wa/%id · iowait · pidstat · perf top · strace · cửa sổ 1/5/15 phút`

## 5-card — middle — [Linux, systemd, Debugging]
**Question:** A systemd service flaps: `systemctl status app` shows it cycling `activating → failed → activating`, and after a minute it gives up with `start-limit-hit`. How do you find why it crashes, and what do `Restart=` and `StartLimitBurst=` control?
**Verdict:** KEEP — diagnosis via journalctl plus restart-policy / start-limit semantics and crash-loop trade-offs; solid middle question.

### New answer (en)
**TL;DR** — The status line is a symptom — the cause is in the logs: `journalctl -u app -e`. `Restart=` makes systemd relaunch a process that exits; `StartLimitBurst=` is the circuit breaker that stops it retrying forever and produces `start-limit-hit`.

**How it works** — Read the real exit from the journal: non-zero code, stack trace, missing env var, or a config it can't open (`-f` to follow, `--since "5 min ago"` to scope). `Restart=on-failure`/`always` is what relaunches on exit. `StartLimitBurst=N` with `StartLimitIntervalSec=T` means: more than N restarts within T seconds → systemd stops and enters `failed` with `start-limit-hit`. After fixing the cause, clear the latch with `systemctl reset-failed app` then `systemctl start app`.

:::muted
**Trade-off** — `Restart=always` maximises self-healing but can mask a real bug: a service that crash-loops forever looks "up" to a naive check while serving nothing. Tune `RestartSec=` to back off and keep `StartLimitBurst` finite so a broken release fails loudly instead of hammering the box. Transient failures (DB not ready) want generous restarts; deterministic ones (bad config) want to fail fast and page a human.
:::

:::muted
**Common pitfall** — A crash loop where each attempt reconnects to a database is a self-inflicted thundering herd — N instances restarting in lockstep can knock over the very dependency they're waiting on. Also, `systemctl status` truncates to a few recent lines, so people miss the real error — always go to `journalctl -u`. And forgetting `reset-failed` means even a perfectly fixed binary won't start because the start-limit latch is still tripped.
:::

*Go deeper — the service needs Postgres before it starts; how do you express that dependency and avoid the crash-loop entirely with `After=`/`Requires=` or readiness retries?*

**Keywords** — `journalctl -u -e · Restart=on-failure · StartLimitBurst / StartLimitIntervalSec · start-limit-hit · reset-failed · RestartSec`

### New answer (vi)
**Chốt** — Dòng status là triệu chứng — nguyên nhân nằm trong log: `journalctl -u app -e`. `Restart=` khiến systemd khởi động lại process khi nó thoát; `StartLimitBurst=` là cầu dao ngăn nó retry mãi mãi và sinh ra `start-limit-hit`.

**Cơ chế** — Đọc cú exit thực sự từ journal: mã exit khác 0, stack trace, biến môi trường thiếu, hay config không mở được (`-f` để theo dõi, `--since "5 min ago"` để khoanh vùng). `Restart=on-failure`/`always` là thứ khởi động lại khi thoát. `StartLimitBurst=N` cùng `StartLimitIntervalSec=T` nghĩa là: restart hơn N lần trong T giây → systemd ngừng và vào `failed` với `start-limit-hit`. Sau khi sửa gốc rễ, gỡ chốt bằng `systemctl reset-failed app` rồi `systemctl start app`.

:::muted
**Trade-off** — `Restart=always` tối đa hóa tự phục hồi nhưng có thể che một bug thật: một service crash-loop mãi mãi trông như "up" với một check ngây thơ trong khi chẳng phục vụ gì. Tinh chỉnh `RestartSec=` để giãn cách và giữ `StartLimitBurst` hữu hạn để một bản release hỏng fail ồn ào thay vì nện liên hồi vào máy. Lỗi tạm thời (DB chưa sẵn sàng) cần restart rộng rãi; lỗi tất định (config sai) cần fail nhanh và page con người.
:::

:::muted
**Bẫy thường gặp** — Một crash loop mà mỗi lần thử lại kết nối tới database là một thundering herd tự gây ra — N instance restart đồng loạt có thể quật ngã chính cái dependency chúng đang chờ. Ngoài ra, `systemctl status` cắt ngắn còn vài dòng gần nhất, nên người ta bỏ sót lỗi thật — luôn vào `journalctl -u`. Và quên `reset-failed` nghĩa là kể cả một binary đã sửa hoàn hảo cũng không khởi động vì chốt start-limit vẫn còn gài.
:::

*Đào sâu tiếp — service cần Postgres trước khi khởi động; làm sao biểu diễn dependency đó và tránh hẳn crash-loop bằng `After=`/`Requires=` hay readiness retry?*

**Từ khoá ăn điểm** — `journalctl -u -e · Restart=on-failure · StartLimitBurst / StartLimitIntervalSec · start-limit-hit · reset-failed · RestartSec`

## 6-card — senior — [Linux, Signals, Containers]
**Question:** During every rolling deploy a few in-flight requests return errors and some DB writes look half-done. The container "stops fine." What is the difference between SIGTERM and SIGKILL, and how does it explain this?
**Verdict:** KEEP — SIGTERM vs SIGKILL graceful-shutdown reasoning plus the PID-1 / exec-form container trap; strong senior depth.

### New answer (en)
**TL;DR** — `SIGTERM` (15) is a *polite* request the process can catch to drain in-flight work and exit cleanly — **graceful shutdown**. `SIGKILL` (9) can't be caught and terminates immediately, mid-write. Your errors mean the app either ignores `SIGTERM` or doesn't finish draining inside the grace window.

**How it works** — The orchestrator's contract is: send `SIGTERM`, wait a grace period (Docker default 10 s, Kubernetes `terminationGracePeriodSeconds` 30 s), then `SIGKILL` whatever's left. If the app has no `SIGTERM` handler it runs until the hard kill; if draining outlasts the window it's cut off mid-request. Fix: install a `SIGTERM` handler that stops the listener and awaits in-flight work, and size the grace period above your longest healthy request.

:::muted
**Trade-off** — Longer grace periods make shutdowns safer but slow every deploy and node drain, and a stuck process eats the whole window before `SIGKILL`. Shorter periods deploy fast but risk cutting off slow requests. The balance: drain aggressively (close the listener immediately, fail readiness so no new traffic arrives) so the window only covers genuinely in-flight work. Idempotent writes plus upstream retries turn a missed drain from data corruption into a harmless retry.
:::

:::muted
**Common pitfall** — The container trap: as **PID 1** the kernel applies *no* default signal handlers, so an app without an explicit `SIGTERM` handler ignores it and is only ever `SIGKILL`ed after the grace period — every deploy is a hard kill. Worse, shell-form `CMD` runs your app under `/bin/sh -c`, which becomes PID 1 and often doesn't forward signals to the child. Use exec-form `CMD` or an init like `tini` so signals reach your process.
:::

*Go deeper — you've added a `SIGTERM` handler and drains work, but Kubernetes still cuts some connections; how do `preStop` hooks and readiness-gate timing close that last race?*

**Keywords** — `SIGTERM 15 vs SIGKILL 9 · graceful shutdown · drain · terminationGracePeriodSeconds · PID 1 · exec-form CMD · tini`

### New answer (vi)
**Chốt** — `SIGTERM` (15) là một yêu cầu *lịch sự* mà process có thể bắt để drain việc đang xử lý rồi thoát sạch — **graceful shutdown**. `SIGKILL` (9) không thể bị bắt và kết thúc ngay lập tức, giữa chừng đang ghi. Lỗi của bạn nghĩa là app hoặc phớt lờ `SIGTERM`, hoặc không drain xong trong cửa sổ grace.

**Cơ chế** — Hợp đồng của orchestrator là: gửi `SIGTERM`, chờ một khoảng grace (Docker mặc định 10 giây, Kubernetes `terminationGracePeriodSeconds` 30 giây), rồi `SIGKILL` những gì còn lại. Nếu app không có handler `SIGTERM` thì nó chạy tới khi bị kill cứng; nếu drain lâu hơn cửa sổ thì bị cắt giữa chừng request. Sửa: cài một handler `SIGTERM` để ngừng listener và đợi việc đang xử lý xong, và đặt grace period lớn hơn request khỏe mạnh dài nhất.

:::muted
**Trade-off** — Grace period dài hơn làm shutdown an toàn hơn nhưng làm chậm mọi lần deploy và drain node, và một process bị kẹt vẫn ngốn hết cửa sổ trước khi `SIGKILL`. Grace ngắn hơn deploy nhanh nhưng nguy cơ cắt ngang request chậm. Cân bằng: drain quyết liệt (đóng listener ngay, fail readiness để không có traffic mới tới) để cửa sổ grace chỉ bao phủ việc thực sự đang xử lý. Lệnh ghi idempotent cộng retry phía trên biến một lần drain hụt từ hỏng dữ liệu thành một retry vô hại.
:::

:::muted
**Bẫy thường gặp** — Bẫy container: khi chạy như **PID 1**, kernel *không* áp signal handler mặc định, nên một app không có handler `SIGTERM` tường minh sẽ phớt lờ nó và chỉ bị `SIGKILL` sau grace period — mỗi lần deploy là một cú kill cứng. Tệ hơn, `CMD` dạng shell bọc app dưới `/bin/sh -c`, vốn trở thành PID 1 và thường không forward signal xuống tiến trình con. Hãy dùng `CMD` dạng exec hoặc một init như `tini` để signal thật sự tới được process.
:::

*Đào sâu tiếp — bạn đã thêm handler `SIGTERM` và drain chạy được, nhưng Kubernetes vẫn cắt một số kết nối; `preStop` hook và thời điểm readiness-gate đóng nốt cái race cuối thế nào?*

**Từ khoá ăn điểm** — `SIGTERM 15 vs SIGKILL 9 · graceful shutdown · drain · terminationGracePeriodSeconds · PID 1 · exec-form CMD · tini`

## 7-card — staff — [Linux, Security, SSH]
**Question:** You inherit a fleet where everyone SSHes in as `root` with a shared private key copied around in Slack. Design least-privilege SSH access for a growing team, and explain the risk of `ssh -A` agent forwarding.
**Verdict:** KEEP — open-ended design question that scales with team size, with real attack-surface reasoning and the agent-forwarding pivot; genuine staff depth.

### New answer (en)
**TL;DR** — Move from a shared secret to **per-person identity + auditability**: keys-only auth, no root login, individual keypairs, escalate via `sudo`, funnel through a bastion, and at scale replace static keys with short-lived SSH certificates. `ssh -A` is dangerous because root on the remote box can hijack your forwarded agent to authenticate onward as you.

**How it works** — In `sshd_config`: `PermitRootLogin no` and `PasswordAuthentication no`. Each engineer has their own keypair; their public key goes in `authorized_keys` (managed by config management, not by hand). People log in as an unprivileged user and escalate through `sudo`, which logs *who* ran *what*. A **bastion/jump host** (`ProxyJump`) removes public SSH from private hosts and gives one choke point to log and lock down. At real scale, an **SSH CA** signs short-lived certs (valid minutes/hours), killing the "revoke a key everywhere" problem — you just stop signing.

:::muted
**Trade-off** — Per-user keys give clean attribution but a distribution/rotation burden; an SSH CA solves rotation but adds a CA to run and secure. Bastions centralise audit and shrink attack surface yet become a single point of failure and a latency hop, so they must be hardened and HA. The progression matches team size: shared key (never) → per-user keys in config management (small) → SSH CA + short-lived certs + bastion (real org).
:::

:::muted
**Common pitfall** — `ssh -A` exposes your *local* agent socket on the remote box; **root on that host can use the forwarded agent to authenticate onward as you** to every system your key reaches — one compromised hop pivots across the fleet. Prefer `ProxyJump` (never exposes your agent to the intermediate host) and forward only to fully trusted hosts. The deeper failure is the shared key itself: no attribution, and revoking it means rotating one secret across the entire fleet at once — exactly when you're already in an incident.
:::

*Go deeper — with an SSH CA issuing short-lived certs, how do you handle break-glass access and CA-key compromise without recreating the single-shared-secret problem?*

**Keywords** — `PermitRootLogin no · PasswordAuthentication no · authorized_keys · sudo audit · ProxyJump/bastion · SSH CA short-lived certs · agent forwarding pivot`

### New answer (vi)
**Chốt** — Chuyển từ secret dùng chung sang **danh tính theo từng người + khả năng truy vết**: chỉ xác thực bằng key, cấm root login, keypair riêng từng người, leo quyền qua `sudo`, dồn qua bastion, và ở quy mô lớn thay key tĩnh bằng SSH certificate ngắn hạn. `ssh -A` nguy hiểm vì root trên host từ xa có thể chiếm forwarded agent của bạn để xác thực tiếp với tư cách bạn.

**Cơ chế** — Trong `sshd_config`: `PermitRootLogin no` và `PasswordAuthentication no`. Mỗi kỹ sư có keypair riêng; public key của họ đặt vào `authorized_keys` (do config management quản lý, không làm tay). Người ta đăng nhập bằng một user không đặc quyền rồi leo quyền qua `sudo`, vốn ghi log *ai* chạy *gì*. Một **bastion/jump host** (`ProxyJump`) gỡ SSH public khỏi host private và cho một điểm nghẽn duy nhất để log và siết. Ở quy mô thật, một **SSH CA** ký các cert ngắn hạn (hiệu lực vài phút/giờ), xóa luôn bài toán "revoke một key ở mọi nơi" — chỉ cần ngừng ký.

:::muted
**Trade-off** — Key theo từng user cho truy vết sạch nhưng gánh nặng phân phối/xoay key; một SSH CA giải quyết xoay vòng nhưng thêm một CA phải vận hành và bảo vệ. Bastion tập trung hóa audit và thu nhỏ bề mặt tấn công nhưng trở thành điểm lỗi đơn lẻ và một chặng latency, nên phải hardening và HA. Lộ trình khớp quy mô team: key dùng chung (đừng bao giờ) → key theo user trong config management (nhỏ) → SSH CA + cert ngắn hạn + bastion (tổ chức thật).
:::

:::muted
**Bẫy thường gặp** — `ssh -A` phơi socket agent *cục bộ* của bạn lên host từ xa; **root trên host đó có thể dùng forwarded agent của bạn để xác thực tiếp với tư cách bạn** tới mọi hệ thống mà key vươn tới — một chặng bị xâm nhập là pivot khắp fleet. Hãy ưu tiên `ProxyJump` (không bao giờ phơi agent cho host trung gian) và chỉ forward tới host hoàn toàn tin tưởng. Lỗi sâu xa hơn chính là cái key dùng chung: không truy vết được, và revoke nó nghĩa là xoay một secret trên toàn fleet cùng lúc — đúng lúc bạn vốn đã đang trong một sự cố.
:::

*Đào sâu tiếp — với SSH CA cấp cert ngắn hạn, làm sao xử lý break-glass access và trường hợp CA-key bị lộ mà không tái tạo lại bài toán single-shared-secret?*

**Từ khoá ăn điểm** — `PermitRootLogin no · PasswordAuthentication no · authorized_keys · sudo audit · ProxyJump/bastion · SSH CA short-lived certs · agent forwarding pivot`
