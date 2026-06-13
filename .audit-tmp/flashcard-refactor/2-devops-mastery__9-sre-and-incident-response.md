# 2-devops-mastery / 9-sre-and-incident-response
Summary: kept 8, delete 0 of 8

## 0-card — junior — [SRE, Error Budget]
**Question:** Your team ships features fast but pages constantly, and an exec asks "should we just stop deploying so it stops breaking?" Using SRE concepts — toil, error budgets, and reliability-as-a-feature — how do you frame the answer instead of picking "speed" or "stability"?
**Verdict:** KEEP — open-ended framing question; tests whether the candidate can reframe a false dichotomy using core SRE concepts.

### New answer (en)
**TL;DR** — It's not "speed vs stability." SRE treats reliability as a feature with an explicit budget: you pick an SLO, the gap below 100% is the error budget, and that budget — not opinion — decides whether you keep deploying or slow down.

**How it works** — Set an SLO (say 99.9% availability); the 0.1% you're allowed to miss is the *error budget* — the unreliability you may spend. Plenty of budget left → the data says keep shipping fast. Budget blown → you slow down and pour effort into stability until you're back in the black. *Toil* — manual, repetitive, automatable ops work that scales with traffic but adds no lasting value — is capped (often ~50%) so engineers spend the rest building automation that removes future toil. So you tell the exec: "We don't guess between speed and stability — we let the error budget make that call objectively."

:::muted
**Common pitfall** — Measuring an SLO that doesn't reflect user pain (raw server uptime while checkout silently fails) so the budget looks healthy during a real outage. Or letting toil creep past the cap until the team is 90% firefighting and never escapes the pages.
:::

*Go deeper: who has the authority to enforce the freeze when the budget is exhausted, and what happens if leadership overrides it?*

**Keywords** — `SLO · error budget · toil · reliability-as-a-feature · 99.9%`

### New answer (vi)
**Chốt** — Không phải "tốc độ vs ổn định." SRE coi reliability là một feature có ngân sách rõ ràng: bạn chọn một SLO, khoảng cách dưới 100% là error budget, và chính budget đó — không phải cảm tính — quyết định bạn cứ deploy nhanh hay phải chậm lại.

**Cơ chế** — Đặt một SLO (ví dụ 99.9% availability); 0.1% được phép hụt chính là *error budget* — lượng "không-tin-cậy" bạn được tiêu. Còn nhiều budget → dữ liệu nói cứ ship nhanh. Đốt hết budget → chậm lại, dồn công sức vào ổn định cho tới khi về số dương. *Toil* — việc vận hành thủ công, lặp lại, tự động hóa được, tăng theo traffic mà không tạo giá trị lâu dài — bị giới hạn (thường ~50%) để kỹ sư dùng phần còn lại xây automation xóa toil tương lai. Vậy bạn nói với sếp: "Chúng ta không đoán giữa tốc độ và ổn định — để error budget ra quyết định đó một cách khách quan."

:::muted
**Bẫy thường gặp** — Đo một SLO không phản ánh nỗi đau người dùng (uptime server trong khi checkout lỗi âm thầm) nên budget trông khỏe mạnh giữa một outage thật. Hoặc để toil leo vượt giới hạn cho tới khi team 90% chữa cháy và không bao giờ thoát khỏi các page.
:::

*Đào sâu tiếp: ai có thẩm quyền cưỡng chế lệnh freeze khi budget cạn, và chuyện gì xảy ra nếu lãnh đạo override nó?*

**Từ khoá ăn điểm** — `SLO · error budget · toil · reliability-as-a-feature · 99.9%`

## 1-card — middle — [Incident Response, On-call]
**Question:** A Sev1 fires at 3 a.m.: checkout is down, six engineers jump on the bridge, everyone is debugging in parallel and talking over each other, and nobody is updating the status page. Walk through the incident lifecycle and the roles you'd assign to turn this chaos into a controlled response.
**Verdict:** KEEP — process + role-design question with real diagnosis depth; scales naturally with seniority.

### New answer (en)
**TL;DR** — Impose a lifecycle (detect → triage → mitigate → resolve) and assign roles. The single highest-leverage move is naming an **Incident Commander** who coordinates and does *not* debug, turning six parallel debuggers into one effort with a single source of truth.

**How it works** — *Detect*: an alert or customer report opens the incident and assigns a severity. *Triage*: assess blast radius, declare the Sev, pull in the right people. *Mitigate*: stop the bleeding first — roll back, fail over, disable the feature — restoring service even before root cause is understood. *Resolve*: once stable, fix the underlying cause and formally close, then run a postmortem. Roles tame the chaos: an **Incident Commander** owns decisions and coordination, an **Ops lead** drives the hands-on remediation, a **Comms lead** owns the status page and stakeholder updates, and a **Scribe** keeps a timestamped timeline.

:::muted
**Trade-off** — Mitigation-first restores users fastest but can destroy forensic evidence — the crashed pod you killed held the smoking-gun logs — so you trade a slower root-cause investigation for faster recovery. Usually the right call, but capture state before you wipe it. Scale ceremony to severity: a Sev3 is one engineer, a Sev1 the full role set.
:::

:::muted
**Common pitfall** — The IC getting sucked into debugging, so nobody coordinates and the free-for-all returns. Or conflating mitigation with resolution — roll back, declare victory, skip root cause, and the same outage recurs next deploy. Silence on the status page erodes trust faster than the outage itself.
:::

*Go deeper: how do you hand off the IC role on a long incident that crosses shift boundaries without losing context?*

**Keywords** — `Incident Commander · blast radius · mitigate-first · status page · Scribe · MTTR`

### New answer (vi)
**Chốt** — Áp một vòng đời (detect → triage → mitigate → resolve) và phân vai. Nước đi đòn bẩy cao nhất là chỉ định một **Incident Commander** điều phối và *không* tự debug, biến sáu người debug song song thành một nỗ lực với một nguồn sự thật duy nhất.

**Cơ chế** — *Detect*: alert hoặc báo cáo khách hàng mở incident và gán severity. *Triage*: đánh giá blast radius, tuyên bố Sev, kéo đúng người vào. *Mitigate*: cầm máu trước — rollback, fail over, tắt feature — khôi phục dịch vụ ngay cả trước khi hiểu root cause. *Resolve*: khi đã ổn định, sửa nguyên nhân gốc rồi đóng chính thức, sau đó chạy postmortem. Vai trò dẹp hỗn loạn: **Incident Commander** sở hữu quyết định và điều phối, **Ops lead** dẫn dắt khắc phục trực tiếp, **Comms lead** lo status page và cập nhật stakeholder, **Scribe** giữ timeline có dấu thời gian.

:::muted
**Trade-off** — Mitigation-first khôi phục người dùng nhanh nhất nhưng có thể phá hủy bằng chứng điều tra — cái pod bị crash bạn kill đang giữ log "súng còn bốc khói" — nên bạn đánh đổi điều tra root-cause chậm hơn lấy phục hồi nhanh hơn. Thường là lựa chọn đúng, nhưng hãy chụp state trước khi xóa. Co giãn nghi thức theo severity: Sev3 một kỹ sư, Sev1 đủ bộ vai trò.
:::

:::muted
**Bẫy thường gặp** — IC bị hút vào debug nên không ai điều phối và cảnh hỗn loạn tái diễn. Hoặc đánh đồng mitigation với resolution — rollback, tuyên bố thắng, bỏ qua root cause, và đúng outage đó tái diễn ở lần deploy sau. Im lặng trên status page bào mòn niềm tin nhanh hơn cả bản thân outage.
:::

*Đào sâu tiếp: bạn bàn giao vai IC trên một incident dài vắt qua ranh giới ca trực thế nào mà không mất ngữ cảnh?*

**Từ khoá ăn điểm** — `Incident Commander · blast radius · mitigate-first · status page · Scribe · MTTR`

## 2-card — middle — [Postmortem, Culture]
**Question:** After an outage, your postmortem doc concludes "Engineer pushed a bad config; reminded the team to be more careful." Three weeks later the same class of outage recurs. What's wrong with this postmortem culturally and structurally, and how do you write one that actually prevents recurrence?
**Verdict:** KEEP — culture + structure critique with a clear "why it recurred" diagnosis; strong middle-level question.

### New answer (en)
**TL;DR** — "Be more careful" is a wish, not an action item, and blaming the human hides the systemic gap. A *blameless* postmortem asks "what about the **system** let a single bad config reach prod?" and turns each gap into a concrete, owned, dated action item.

**How it works** — Blameless assumes everyone acted reasonably given the info and tools they had, then drills into systemic causes: no config validation in CI, no canary, no automated rollback, no second reviewer. Each becomes "Add schema validation to the config pipeline (owner: X, due: date)," tracked to completion like any other work. A good postmortem has a factual timeline, *contributing factors* (not one root cause), what went well, and a small set of high-leverage action items.

:::muted
**Trade-off** — Blameless is *not* accountability-free: accountability shifts from "punish the human" to "the org owns fixing the system," which some managers find unsatisfying. Thorough postmortems cost real time, so reserve the full treatment for incidents above a severity threshold and keep lightweight notes for the rest.
:::

:::muted
**Common pitfall** — The "action-item graveyard": tickets filed, nobody owns or schedules them, they age out, the identical outage returns — exactly your recurrence. Vague items ("improve monitoring") with no owner or due date equal no action. And the moment blame creeps in, engineers sanitize timelines and stop reporting near-misses.
:::

*Go deeper: how do you make action items from a postmortem compete for priority against regular feature work instead of being silently deprioritized?*

**Keywords** — `blameless · contributing factors · action item (owner+due) · near-miss · systemic cause`

### New answer (vi)
**Chốt** — "Cẩn thận hơn" là một điều ước, không phải action item, và đổ lỗi con người che giấu lỗ hổng hệ thống. Một postmortem *blameless* hỏi "**hệ thống** nào để một config sai lọt vào prod?" và biến mỗi lỗ hổng thành một action item cụ thể, có chủ, có hạn.

**Cơ chế** — Blameless giả định mọi người đã hành động hợp lý với thông tin và công cụ họ có, rồi đào vào nguyên nhân hệ thống: không validation config trong CI, không canary, không rollback tự động, không người review thứ hai. Mỗi cái thành "Thêm schema validation vào config pipeline (chủ: X, hạn: ngày)," theo dõi tới khi xong như mọi việc khác. Một postmortem tốt có timeline dựa trên sự thật, *các yếu tố góp phần* (không phải một root cause), những gì đã tốt, và một tập nhỏ action item đòn bẩy cao.

:::muted
**Trade-off** — Blameless *không* nghĩa là không accountability: accountability dịch từ "trừng phạt con người" sang "tổ chức sở hữu việc sửa hệ thống," điều vài quản lý thấy không thỏa mãn. Postmortem kỹ lưỡng tốn thời gian thật, nên dành bản đầy đủ cho incident trên một ngưỡng severity và giữ ghi chú nhẹ cho phần còn lại.
:::

:::muted
**Bẫy thường gặp** — "Nghĩa địa action item": ticket được tạo, không ai sở hữu hay lên lịch, chúng già đi, đúng outage đó quay lại — chính là tái diễn của bạn. Item mơ hồ ("cải thiện monitoring") không chủ không hạn tương đương không hành động. Và khoảnh khắc đổ lỗi len vào, kỹ sư tô vẽ timeline và ngừng báo cáo near-miss.
:::

*Đào sâu tiếp: làm sao để action item từ postmortem cạnh tranh ưu tiên với feature work thay vì bị âm thầm hạ ưu tiên?*

**Từ khoá ăn điểm** — `blameless · contributing factors · action item (chủ+hạn) · near-miss · systemic cause`

## 3-card — senior — [MTTR, On-call]
**Question:** Your incidents get *detected* quickly but take hours to *resolve*, and the on-call rotation is burning people out so badly that your best engineers are quitting. As the senior engineer owning reliability, what concrete levers — runbooks, alerting quality, rotation design — do you pull to cut MTTR without grinding the team to dust?
**Verdict:** KEEP — multi-lever senior design question balancing MTTR against human sustainability; rich trade-offs.

### New answer (en)
**TL;DR** — Decompose MTTR (detect → ack → mitigate → resolve) and, since detection is fine, attack mitigate/resolve with three levers: runbooks per alert, symptom-based high-signal alerting, and a rotation thick enough to be humane. Burnout *is* a reliability risk — the people who know the systems are the ones quitting.

**How it works** — **Runbooks**: every alert links to a step-by-step runbook with diagnosis commands and known mitigations, so a half-asleep on-call doesn't reverse-engineer the system at 3 a.m. **Alerting quality**: page on user-facing symptoms (SLO burn rate) not noisy causes, make every page actionable, and route non-urgent signals to dashboards/tickets so the pager fires only when a human must act *now*. **Rotation design**: enough people that each rotates infrequently (a humane target is ~one on-call week every 6–8 weeks), follow-the-sun across time zones to avoid night pages, comp for nights, and a hard cap on pages/shift that triggers a reliability investment when breached. Pair with correlated logs/metrics/traces so diagnosis is fast, not archaeological.

:::muted
**Trade-off** — Tuning toward symptom-based, high-signal paging reduces burnout but risks missing a novel failure no SLO covers yet — you accept slightly later detection of unknown-unknowns for an on-call people trust and respond to. Runbooks and automation have real upfront cost and rot if unused; run game days and update runbooks *during* real incidents to keep them alive.
:::

:::muted
**Common pitfall** — Alert fatigue dominates: when most pages are noise, on-call mutes the pager and a real Sev1 sits unacknowledged, inflating MTTR worse than no alerting at all. Stale runbooks are dangerous — a confident engineer follows outdated steps and makes things worse. A too-thin rotation means two heroes carry everything, burn out, quit, and take tribal knowledge with them.
:::

*Go deeper: which single metric would you put on the leadership dashboard to make the case for funding more on-call headcount?*

**Keywords** — `MTTR · time-to-ack · SLO burn rate · runbook · follow-the-sun · alert fatigue · game day`

### New answer (vi)
**Chốt** — Phân rã MTTR (detect → ack → mitigate → resolve) và vì detection đã ổn, tấn công mitigate/resolve bằng ba đòn bẩy: runbook cho từng alert, alerting symptom-based high-signal, và một rotation đủ dày để nhân văn. Burnout *là* một rủi ro reliability — chính những người hiểu hệ thống là người nghỉ việc.

**Cơ chế** — **Runbook**: mỗi alert link tới một runbook từng bước với lệnh chẩn đoán và cách mitigate đã biết, để một on-call nửa tỉnh nửa mê không phải reverse-engineer hệ thống lúc 3 giờ sáng. **Chất lượng alerting**: page theo triệu chứng người dùng thấy (SLO burn rate) chứ không phải nguyên nhân ồn ào, mọi page đều actionable, đẩy tín hiệu không khẩn về dashboard/ticket để pager chỉ kêu khi một con người phải hành động *ngay*. **Thiết kế rotation**: đủ người để mỗi người luân phiên thưa (mục tiêu nhân văn ~một tuần on-call mỗi 6–8 tuần), follow-the-sun qua các múi giờ để tránh page đêm, bù cho ca đêm, và một trần cứng số page/ca mà khi vượt sẽ kích hoạt một khoản đầu tư reliability. Đi kèm log/metric/trace tương quan để chẩn đoán nhanh, không phải khảo cổ.

:::muted
**Trade-off** — Tinh chỉnh theo hướng symptom-based, high-signal giảm burnout nhưng có rủi ro bỏ sót một failure mới lạ chưa SLO nào phủ — bạn chấp nhận detect các unknown-unknown trễ hơn chút để đổi lấy một on-call mọi người tin và phản hồi. Runbook và automation tốn chi phí ban đầu thật và sẽ mục nếu không dùng; chạy game day và cập nhật runbook *ngay trong* incident thật để chúng luôn sống.
:::

:::muted
**Bẫy thường gặp** — Alert fatigue thống trị: khi đa số page là noise, on-call mute pager và một Sev1 thật nằm không được acknowledge, đẩy MTTR tệ hơn cả không có alerting. Runbook cũ nguy hiểm — một kỹ sư tự tin làm theo các bước lỗi thời và khiến mọi thứ tệ hơn. Rotation quá mỏng nghĩa là hai người hùng gánh tất cả, burn out, nghỉ, mang theo tri thức bộ lạc.
:::

*Đào sâu tiếp: bạn sẽ đặt một metric duy nhất nào lên dashboard lãnh đạo để thuyết phục cấp ngân sách thêm headcount on-call?*

**Từ khoá ăn điểm** — `MTTR · time-to-ack · SLO burn rate · runbook · follow-the-sun · alert fatigue · game day`

## 4-card — senior — [Capacity Planning, Load Testing]
**Question:** A flash sale is launching in two weeks and marketing expects 10x normal traffic. Leadership asks "will we survive?" How do you use capacity planning and load testing to answer that with evidence instead of a hopeful guess — and what exactly are you trying to find?
**Verdict:** KEEP — evidence-driven planning question with clear methodology and bottleneck-diagnosis depth.

### New answer (en)
**TL;DR** — Don't guess linearly — *prove* it. Tie a business metric (peak RPS, orders/sec) to the resources needed to hold your SLO, then load-test to find your real ceiling and the first bottleneck. The deliverable is "we tested to 12x, SLO held to 11x, here's the bottleneck we fixed and the autoscaling."

**How it works** — Start from current production numbers, project the 10x peak with headroom. Run a **load test** at expected peak to confirm SLO compliance; a **stress test** ramping past peak to find the breaking point (where latency hockey-sticks or errors climb) so you know your true ceiling and margin; a **soak test** at sustained high load to surface slow leaks (memory, connection pools, disk). Test against production-like infra and data volumes, find the first bottleneck (often the database or a connection pool, *not* CPU), fix or scale it, and repeat.

:::muted
**Trade-off** — Production-fidelity tests are expensive and risky (can take down real systems or pollute data); a cheap scaled-down staging test is safe but lies — staging rarely matches prod's data size, cache warmth, or noisy neighbors. You trade fidelity for safety/cost and must be explicit. Over-provisioning guarantees survival but burns money on idle capacity; tight provisioning + aggressive autoscaling is cheaper but bets scale-up is fast enough for a sudden spike.
:::

:::muted
**Common pitfall** — Testing only the happy path and the stateless web tier, so you scale app servers but the *database* pool or a third-party payment API caps out first and everything collapses at 4x. Autoscaling on a slow metric (or hitting cloud quota / cold-start lag) can't keep up with a flash-sale spike. And under-distributed load generators become the bottleneck themselves, giving falsely optimistic numbers.
:::

*Go deeper: how do you load-test a flow that hits a third-party payment provider you can't actually hammer at 10x?*

**Keywords** — `peak RPS · headroom · load/stress/soak test · breaking point · connection pool · autoscaling cold-start`

### New answer (vi)
**Chốt** — Đừng đoán tuyến tính — *chứng minh* đi. Gắn một metric kinh doanh (peak RPS, order/giây) với tài nguyên cần để giữ SLO, rồi load-test để tìm trần thật và bottleneck đầu tiên. Sản phẩm giao là "chúng ta test tới 12x, SLO giữ tới 11x, đây là bottleneck đã sửa và autoscaling."

**Cơ chế** — Bắt đầu từ số production hiện tại, dự phóng peak 10x kèm headroom. Chạy một **load test** ở peak kỳ vọng để xác nhận tuân thủ SLO; một **stress test** ramp vượt peak để tìm breaking point (nơi latency dựng đứng hoặc error leo lên) để biết trần thật và biên độ; một **soak test** ở tải cao kéo dài để phơi bày rò rỉ chậm (memory, connection pool, disk). Test trên hạ tầng và khối lượng dữ liệu giống production, tìm bottleneck đầu tiên (thường là database hoặc một connection pool, *không* phải CPU), sửa hoặc scale, rồi lặp lại.

:::muted
**Trade-off** — Test giống production thật thì tốn kém và rủi ro (có thể làm sập hệ thống thật hoặc bẩn dữ liệu); một test rẻ trên staging thu nhỏ thì an toàn nhưng nói dối — staging hiếm khi khớp kích thước dữ liệu, độ ấm cache, hay noisy-neighbor của prod. Bạn đánh đổi fidelity lấy an toàn/chi phí và phải nói rõ. Over-provision đảm bảo sống sót nhưng đốt tiền cho năng lực nhàn rỗi; provision sát + autoscaling quyết liệt rẻ hơn nhưng đặt cược scale-up đủ nhanh cho cú spike đột ngột.
:::

:::muted
**Bẫy thường gặp** — Chỉ test happy path và tầng web stateless, nên bạn scale app server nhưng connection pool *database* hoặc một payment API bên thứ ba cạn trước và cả hệ thống sụp ở 4x. Autoscaling phản ứng trên một metric chậm (hoặc dính quota cloud / cold-start) không theo kịp một spike flash-sale. Và load generator không đủ phân tán sẽ tự thành bottleneck, cho những con số lạc quan giả.
:::

*Đào sâu tiếp: bạn load-test thế nào một flow đập vào payment provider bên thứ ba mà bạn không thể thực sự nã ở 10x?*

**Từ khoá ăn điểm** — `peak RPS · headroom · load/stress/soak test · breaking point · connection pool · autoscaling cold-start`

## 5-card — senior — [Graceful Degradation, Resilience]
**Question:** Under a traffic surge your recommendation service starts timing out, and because every product page blocks on it, the *entire* site goes down — not just recommendations. How would you design graceful degradation and kill-switches so an overloaded non-critical dependency can't take the whole system with it?
**Verdict:** KEEP — canonical cascading-failure design question with resilience patterns and sharp failure modes.

### New answer (en)
**TL;DR** — A non-critical dependency must *degrade*, not *cascade*. Wrap the recommendation call in a circuit breaker with a tight timeout and a fallback, add a kill-switch, and shed low-priority load — so the worst case is "recommendations missing for ten minutes," not "the site is down."

**How it works** — Use **tiered criticality**: separate core revenue paths (browse, add-to-cart, checkout) from nice-to-haves. Wrap recs in a **circuit breaker** with a **tight timeout** and a **fallback** — when recs are slow/erroring the breaker opens and the page renders without them (or with a cached/generic list) instead of hanging. Add a **feature flag / kill-switch** so an operator can disable recs site-wide instantly, no deploy, mid-incident. Use **load shedding** to reject or queue low-priority work when saturated, protecting the critical path.

:::muted
**Trade-off** — Degradation trades feature completeness for availability — a worse-but-working experience beats a 500. But every flag is a code path to test, and a stale fallback (cached recs) can serve subtly wrong data. Aggressive shedding protects the core but deliberately turns away paying users, so you must shed the *right* traffic (low-value, retryable) and accept some lost requests to keep checkout alive.
:::

:::muted
**Common pitfall** — The original bug — a synchronous, no-timeout call to a non-critical service on the critical path — is the textbook cascade: threads pile up waiting and the pool exhausts. Untested kill-switches fail or have side effects the one time you flip them for real. And fallbacks that depend on the failing system (a "cached" path still hitting the same overloaded DB) give false safety and fail exactly when needed.
:::

*Go deeper: how do you set the circuit breaker's open/half-open thresholds so it trips fast under real overload but doesn't flap on a transient blip?*

**Keywords** — `circuit breaker · timeout · fallback · kill-switch / feature flag · load shedding · tiered criticality · cascading failure`

### New answer (vi)
**Chốt** — Một dependency không quan trọng phải *degrade*, không *cascade*. Bọc lời gọi recommendation trong một circuit breaker với timeout chặt và một fallback, thêm kill-switch, và shed tải ưu tiên thấp — để trường hợp tệ nhất là "recommendation thiếu trong mười phút," không phải "site sập."

**Cơ chế** — Dùng **criticality phân tầng**: tách path doanh thu cốt lõi (browse, add-to-cart, checkout) khỏi nice-to-have. Bọc recs trong một **circuit breaker** với **timeout chặt** và một **fallback** — khi recs chậm/lỗi, breaker mở và trang render không có recs (hoặc với danh sách cached/generic) thay vì treo. Thêm một **feature flag / kill-switch** để operator tắt recs toàn site tức thì, không deploy, giữa incident. Dùng **load shedding** để từ chối hoặc xếp hàng việc ưu tiên thấp khi bão hòa, bảo vệ critical path.

:::muted
**Trade-off** — Degradation đánh đổi tính đầy đủ feature lấy availability — trải nghiệm tệ-hơn-nhưng-chạy tốt hơn một lỗi 500. Nhưng mỗi flag là một code path phải test, và một fallback cũ (recs cached) có thể phục vụ dữ liệu sai một cách tinh vi. Shedding quyết liệt bảo vệ phần lõi nhưng cố ý quay lưng với người dùng trả tiền, nên bạn phải shed *đúng* traffic (giá trị thấp, retry được) và chấp nhận mất vài request để giữ checkout sống.
:::

:::muted
**Bẫy thường gặp** — Bug gốc — một lời gọi đồng bộ, không timeout tới một service không quan trọng nằm trên critical path — là mẫu cascade kinh điển: thread chất đống chờ và pool cạn. Kill-switch chưa test fail hoặc có side effect đúng cái lần bạn bật nó thật. Và fallback phụ thuộc vào hệ thống đang lỗi (một path "cached" vẫn đập vào cùng DB quá tải) cho an toàn giả và fail đúng lúc cần.
:::

*Đào sâu tiếp: bạn đặt ngưỡng open/half-open của circuit breaker thế nào để nó trip nhanh khi quá tải thật nhưng không flap trên một blip thoáng qua?*

**Từ khoá ăn điểm** — `circuit breaker · timeout · fallback · kill-switch / feature flag · load shedding · tiered criticality · cascading failure`

## 6-card — middle — [Chaos Engineering, Resilience]
**Question:** Your architecture diagram says the system is "resilient to a node failure," but nobody has ever verified it and you're nervous it's only true on paper. A teammate suggests "let's just randomly kill things in prod and see." How do you turn that instinct into a real chaos engineering experiment that's safe and actually proves something?
**Verdict:** KEEP — method question that distinguishes disciplined chaos engineering from a self-scheduled outage; clear reasoning.

### New answer (en)
**TL;DR** — "Randomly kill things and see" is just a self-scheduled outage. Real chaos engineering is a scientific experiment: define a steady state, form a hypothesis, inject a *specific* failure, measure, and keep the blast radius tiny — so a disproved hypothesis is a win, not an incident.

**How it works** — (1) Define a **steady state** — a measurable healthy metric like p99 latency and success rate. (2) Form a **hypothesis** — "if we kill one node, steady state stays within bounds because the load balancer reroutes." (3) **Inject** the specific failure (terminate an instance, add latency, drop a dependency). (4) Measure whether steady state held, and minimize **blast radius** so a failed hypothesis hurts as little as possible. Start in staging, then run small controlled experiments in prod — ideally during business hours with everyone watching, not at 3 a.m. when it breaks for real. A disproved hypothesis means you found a gap on your terms.

:::muted
**Common pitfall** — No hypothesis, steady-state metric, or abort plan isn't chaos engineering — it's an outage you scheduled, and you learn nothing structured from the wreckage. No instant kill switch means a worse-than-expected result becomes a real incident you can't stop. And the cultural trap: teams find gaps, file no action items, and re-run the same experiment next quarter to rediscover the same weaknesses.
:::

*Go deeper: how do you scope the blast radius for a prod experiment — by traffic percentage, a single cell/AZ, or shadow traffic — and what makes you choose one?*

**Keywords** — `steady state · hypothesis · blast radius · abort / kill switch · game day · prod vs staging fidelity`

### New answer (vi)
**Chốt** — "Cứ kill linh tinh xem sao" chỉ là một outage tự lên lịch. Chaos engineering thật là một thí nghiệm khoa học: định nghĩa steady state, lập hypothesis, inject một failure *cụ thể*, đo, và giữ blast radius nhỏ xíu — để một hypothesis bị bác bỏ là chiến thắng, không phải incident.

**Cơ chế** — (1) Định nghĩa một **steady state** — một metric khỏe mạnh đo được như p99 latency và success rate. (2) Lập một **hypothesis** — "nếu kill một node, steady state vẫn trong ngưỡng vì load balancer reroute." (3) **Inject** failure cụ thể (terminate một instance, thêm latency, drop một dependency). (4) Đo xem steady state có giữ được không, và tối thiểu hóa **blast radius** để một hypothesis sai gây hại càng ít càng tốt. Bắt đầu ở staging, rồi chạy các thí nghiệm nhỏ có kiểm soát trên prod — lý tưởng là trong giờ làm việc với mọi người cùng theo dõi, không phải lúc 3 giờ sáng khi nó vỡ thật. Một hypothesis bị bác bỏ nghĩa là bạn tìm ra lỗ hổng theo cách của mình.

:::muted
**Bẫy thường gặp** — Không hypothesis, không metric steady-state, không kế hoạch abort thì không phải chaos engineering — đó là một outage bạn tự lên lịch, và bạn chẳng học được gì có cấu trúc từ đống đổ nát. Không có kill switch tức thì nghĩa là một kết quả tệ hơn dự kiến trở thành một incident thật bạn không dừng được. Và cái bẫy văn hóa: team tìm ra lỗ hổng, không tạo action item, rồi chạy lại đúng thí nghiệm đó quý sau để khám phá lại đúng các điểm yếu.
:::

*Đào sâu tiếp: bạn khoanh vùng blast radius cho một thí nghiệm prod thế nào — theo % traffic, một cell/AZ, hay shadow traffic — và điều gì khiến bạn chọn cái nào?*

**Từ khoá ăn điểm** — `steady state · hypothesis · blast radius · abort / kill switch · game day · prod vs staging fidelity`

## 7-card — staff — [SLO, Reliability Program]
**Question:** You're the staff engineer asked to stand up a reliability program for an org that's grown from 10 to 150 engineers with no SLOs, ad-hoc on-call, and reliability owned by whoever shouts loudest. Leadership wants "fewer outages" but won't accept a feature freeze. How do you design a program — SLOs, error budgets, systematic toil reduction — that scales and changes behavior?
**Verdict:** KEEP — org-scale staff design question spanning technical mechanism and organizational change; full-arc depth.

### New answer (en)
**TL;DR** — Start from the user, not the infra: define SLIs on real user journeys, set SLOs the business actually needs, and let the resulting **error budget** be the pre-agreed policy — spend it and you keep shipping, exhaust it and the owning team pivots to reliability. That self-regulating policy is exactly "fewer outages without a freeze." Then make it scale with a federated platform model.

**How it works** — Define **SLIs** measuring real user experience (success rate, latency, freshness) for a few critical journeys; set **SLOs** at business-needed levels (not 100%); the gap is an **error budget** with an objective, pre-agreed policy. Make reliability *federated*: a small central SRE/platform team builds the paved road (observability, SLO tooling, incident process, golden runbooks) while product teams own their services' SLOs and on-call — so it scales past 150 engineers without a bottleneck. Drive **toil** down systematically: measure it, cap it per team, fund automation of the top sources. Standardize the incident lifecycle and blameless postmortems so every outage yields tracked, systemic action items.

:::muted
**Trade-off** — A central SRE team owning everything becomes a bottleneck and ops dumping ground at 150 engineers; fully decentralized has no consistency. The federated/platform model splits the difference but demands real tooling investment and the political capital to enforce error-budget policy across orgs that just want to ship. Setting SLOs is a negotiation: too strict is the freeze leadership rejected; too loose and the budget never triggers — it's theater.
:::

:::muted
**Common pitfall** — The dominant failure is a budget policy with no executive teeth: when the budget is blown, leadership overrides the freeze for "this one critical launch" and the whole mechanism becomes decorative. Vanity SLIs (CPU, raw uptime) that don't track user pain show green during real outages. And a top-down mandate with no paved road just adds reporting burden, breeds resentment, and gets quietly abandoned — reliability programs die from organizational rejection far more than technical flaws.
:::

*Go deeper: in your first 90 days, which single user journey and SLO do you instrument first to earn credibility, and why that one?*

**Keywords** — `SLI/SLO · error budget policy · federated/platform model · paved road · toil cap · blameless postmortem · executive teeth`

### New answer (vi)
**Chốt** — Bắt đầu từ người dùng, không phải hạ tầng: định nghĩa SLI trên user journey thật, đặt SLO ở mức business thực sự cần, và để **error budget** sinh ra làm policy đã thỏa thuận trước — còn budget thì cứ ship, cạn budget thì team sở hữu pivot sang reliability. Chính policy tự điều tiết đó là "ít outage hơn mà không freeze." Rồi cho nó scale bằng mô hình federated platform.

**Cơ chế** — Định nghĩa **SLI** đo trải nghiệm người dùng thật (success rate, latency, freshness) cho vài journey quan trọng; đặt **SLO** ở mức business cần (không phải 100%); khoảng cách là một **error budget** với policy khách quan, đã thỏa thuận trước. Biến reliability thành *federated*: một team SRE/platform trung tâm nhỏ xây con đường lát sẵn (observability, tooling SLO, quy trình incident, golden runbook) trong khi các product team sở hữu SLO và on-call của service mình — nhờ đó scale vượt 150 kỹ sư mà không tạo bottleneck. Kéo **toil** xuống có hệ thống: đo nó, giới hạn theo từng team, tài trợ automation cho các nguồn lớn nhất. Chuẩn hóa incident lifecycle và blameless postmortem để mỗi outage sinh action item hệ thống được theo dõi.

:::muted
**Trade-off** — Một team SRE trung tâm sở hữu mọi thứ thành bottleneck và bãi đổ rác ops ở mức 150 kỹ sư; phân tán hoàn toàn thì không nhất quán. Mô hình federated/platform chia đôi sự khác biệt nhưng đòi hỏi đầu tư tooling thật và vốn chính trị để cưỡng chế policy error-budget xuyên các org vốn chỉ muốn ship. Đặt SLO là một cuộc đàm phán: quá chặt là đúng cái freeze lãnh đạo từ chối; quá lỏng thì budget không bao giờ kích hoạt — chỉ là diễn.
:::

:::muted
**Bẫy thường gặp** — Failure thống trị là một policy budget không có răng cấp điều hành: khi budget bị đốt, lãnh đạo override freeze cho "đúng cái launch quan trọng này thôi" và cả cơ chế trở thành trang trí. SLI làm màu (CPU, raw uptime) không bám nỗi đau người dùng cho dashboard xanh giữa outage thật. Và một mệnh lệnh từ trên xuống mà không có con đường lát sẵn chỉ thêm gánh nặng báo cáo, nuôi sự bất mãn, và bị âm thầm bỏ rơi — reliability program chết vì bị tổ chức từ chối nhiều hơn hẳn vì lỗi kỹ thuật.
:::

*Đào sâu tiếp: trong 90 ngày đầu, bạn instrument user journey và SLO duy nhất nào trước để tạo uy tín, và vì sao chọn cái đó?*

**Từ khoá ăn điểm** — `SLI/SLO · error budget policy · federated/platform model · paved road · toil cap · blameless postmortem · executive teeth`
