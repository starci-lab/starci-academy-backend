# 1-system-design-mastery / 18-designing-search-and-autocomplete
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Search Basics, Latency]
**Question:** You are designing the search box for a catalog of 50 million products. A user types "wireless headphones" and expects relevant results back in well under 100ms. Why can't you just run a `SELECT ... WHERE name LIKE '%wireless headphones%'` against the products table, and what is the core problem a search system has to solve instead?
**Verdict:** KEEP — open-ended "why this fails + what search really solves"; has a real why, scales with seniority, invites the inverted-index follow-up.

### New answer (en)
**TL;DR** — A leading-wildcard `LIKE '%...%'` can't use any index, so it full-scans all 50M rows on every query — hundreds of ms to seconds. Search instead pre-builds an inverted index and returns documents *ranked by relevance*, not rows matching a substring.

**How it works** — The leading `%` makes a B-tree on `name` unusable, so the database must read every row. A search engine solves a different problem: map free text to a ranked set of relevant docs in tens of ms. That needs three things `LIKE` can't do — tokenize and normalize text (lowercase, stem, strip punctuation), pre-compute a structure mapping each word to the docs containing it (the inverted index), and score matches by relevance. Querying then becomes "look up two terms, intersect their posting lists" instead of "scan everything and substring-match" — orders of magnitude faster.

:::muted
**Trade-off** — You buy read speed with write-time and storage cost: a second, derived copy of the data that must be kept in sync, with re-indexing on every update. You also trade SQL's exact boolean filter for fuzzy, tuned relevance — the right trade for a catalog, where users want the best matches, not every literal substring hit.
:::

:::muted
**Common pitfall** — Treating search as "just add a full-text index and move on": it works small but degrades silently as corpus and traffic grow, with little control over tokenization, ranking, and typos. The index is a derived store — if the pipeline lags, users see stale/missing products while the DB looks fine. Treat it as eventually consistent and monitor indexing lag explicitly.
:::

*Go deeper: what exact data structure is the inverted index, and how does intersecting posting lists hit milliseconds?*

**Keywords** — `inverted index · full table scan · leading wildcard · tokenize · stem · posting list · eventually consistent`

### New answer (vi)
**Chốt** — `LIKE '%...%'` có wildcard ở đầu nên không xài được index, buộc full-scan cả 50 triệu dòng mỗi query — hàng trăm ms tới vài giây. Thay vào đó search dựng sẵn một inverted index và trả về tài liệu *xếp hạng theo độ liên quan*, không phải dòng khớp chuỗi con.

**Cơ chế** — Dấu `%` ở đầu làm B-tree trên `name` vô dụng, nên database phải đọc mọi dòng. Search giải bài toán khác: ánh xạ free text thành tập tài liệu liên quan đã xếp hạng trong vài chục ms. Cần ba thứ `LIKE` không làm được — tokenize và chuẩn hóa văn bản (lowercase, stem, bỏ dấu câu), tính trước cấu trúc ánh xạ mỗi từ tới các tài liệu chứa nó (inverted index), và chấm điểm theo relevance. Query khi đó thành "tra hai term, giao posting list của chúng" thay vì "scan tất cả rồi substring-match" — nhanh hơn nhiều bậc.

:::muted
**Trade-off** — Bạn mua tốc độ đọc bằng chi phí ghi và lưu trữ: một bản sao dẫn xuất phải giữ đồng bộ, kèm re-index mỗi lần cập nhật. Cũng đánh đổi bộ lọc boolean chính xác của SQL lấy relevance mờ, đã tinh chỉnh — đúng cho catalog, nơi người dùng muốn kết quả khớp tốt nhất chứ không phải mọi dòng chứa đúng chuỗi con.
:::

:::muted
**Bẫy thường gặp** — Coi search như "chỉ cần thêm full-text index rồi xong": chạy được ở quy mô nhỏ nhưng âm thầm xuống cấp khi corpus và tải tăng, ít kiểm soát tokenization, ranking, typo. Index là store dẫn xuất — pipeline trễ thì người dùng thấy sản phẩm cũ/thiếu dù DB vẫn đúng. Hãy coi nó là eventually consistent và giám sát indexing lag tường minh.
:::

*Đào sâu tiếp: inverted index chính xác là cấu trúc gì, và giao posting list đạt mili-giây ra sao?*

**Từ khoá ăn điểm** — `inverted index · full table scan · leading wildcard · tokenize · stem · posting list · eventually consistent`

## 1-card — middle — [Inverted Index, Posting Lists]
**Question:** Walk me through the inverted index that powers your product search. A user queries "wireless noise cancelling". Concretely, what data structure do you build at index time, and step by step how does it turn that three-word query into a small candidate set in a few milliseconds instead of scanning the corpus?
**Verdict:** KEEP — demands a concrete mechanism walkthrough with complexity reasoning; classic middle-level depth question with follow-ups.

### New answer (en)
**TL;DR** — At index time you build a dictionary mapping every normalized term to a sorted posting list of doc IDs that contain it. At query time you look up one posting list per query term and intersect the sorted lists — O(total postings), not O(corpus) — so three terms touch a few postings, not 50M rows.

**How it works** — Each document is analyzed into normalized terms (tokenize, lowercase, stem, drop stopwords), and each term points to its posting list: the sorted doc IDs containing it, often with per-doc positions and term frequencies. For "wireless noise cancelling" you fetch three lists — `wireless`, `noise`, `cancel` (stemmed) — and intersect by walking them in parallel, advancing the cursor on the smallest ID. Because the lists are sorted you use skip pointers to leap over gaps, so intersecting a rare term with a common one stays cheap. The result is a small candidate set of docs containing all three terms; the stored frequencies and positions then feed the relevance scorer.

:::muted
**Trade-off** — Fast reads, expensive writes/storage: every insert or update re-analyzes text and splices into many posting lists, so high write rates create indexing pressure and lag. You also choose how much to store per posting — positions enable phrase queries but inflate size; term frequencies enable better scoring but cost memory. Compression (delta-encode sorted doc IDs, variable-byte/PForDelta) shrinks the index but adds decode CPU — trading memory for compute.
:::

:::muted
**Common pitfall** — Mismatched analysis between indexing and querying: if docs are stemmed/lowercased but queries aren't (or use a different tokenizer), terms silently fail to match with no error. Stopword and stemming choices bite too — dropping "not" or over-stemming changes meaning. At scale, a huge posting list for a hot term can blow up intersection cost, so you need skip lists, early termination, and sometimes per-term caps.
:::

*Go deeper: how do positions in the posting list let you answer an exact phrase query like "noise cancelling" as a phrase?*

**Keywords** — `dictionary · posting list · skip pointers · list intersection · term frequency · positions · analyzer parity`

### New answer (vi)
**Chốt** — Lúc index bạn xây một dictionary ánh xạ mỗi term đã chuẩn hóa tới một posting list đã sắp xếp gồm các doc ID chứa nó. Lúc query bạn tra một posting list cho mỗi term rồi giao các list đã sắp xếp — O(tổng postings), không phải O(corpus) — nên ba term chạm vài postings, không phải 50 triệu dòng.

**Cơ chế** — Mỗi tài liệu được phân tích thành các term đã chuẩn hóa (tokenize, lowercase, stem, bỏ stopword), và mỗi term trỏ tới posting list: doc ID đã sắp xếp chứa nó, thường kèm vị trí và term frequency theo từng tài liệu. Với "wireless noise cancelling" bạn lấy ba list — `wireless`, `noise`, `cancel` (đã stem) — và giao bằng cách duyệt song song, dịch con trỏ ở ID nhỏ nhất. Vì list đã sắp xếp, dùng skip pointer để nhảy qua khoảng trống, nên giao một term hiếm với một term phổ biến vẫn rẻ. Kết quả là tập ứng viên nhỏ chứa cả ba term; term frequency và vị trí đã lưu sẽ nuôi bộ chấm điểm relevance.

:::muted
**Trade-off** — Đọc nhanh, ghi/lưu trữ tốn: mỗi insert hay update phải phân tích lại văn bản và chèn vào nhiều posting list, nên write rate cao tạo áp lực và độ trễ indexing. Bạn cũng chọn lưu bao nhiêu mỗi posting — vị trí cho phép phrase query nhưng làm phình size; term frequency cho chấm điểm tốt hơn nhưng tốn bộ nhớ. Nén (delta-encode doc ID đã sắp xếp, variable-byte/PForDelta) thu nhỏ index nhưng thêm CPU giải mã — đánh đổi bộ nhớ lấy compute.
:::

:::muted
**Bẫy thường gặp** — Phân tích lệch nhau giữa indexing và querying: nếu tài liệu được stem/lowercase nhưng query thì không (hoặc dùng tokenizer khác), các term âm thầm không khớp mà chẳng có lỗi. Lựa chọn stopword và stemming cũng cắn — bỏ "not" hoặc over-stem làm đổi nghĩa. Ở quy mô lớn, posting list khổng lồ cho một hot term có thể làm nổ chi phí giao, nên cần skip list, early termination, và đôi khi cap theo từng term.
:::

*Đào sâu tiếp: vị trí trong posting list giúp trả lời một phrase query chính xác như "noise cancelling" theo cụm ra sao?*

**Từ khoá ăn điểm** — `dictionary · posting list · skip pointers · list intersection · term frequency · positions · analyzer parity`

## 2-card — senior — [Autocomplete, Trie]
**Question:** Design the autocomplete that fires on every keystroke as the user types in the search box. It must return the top suggestions in under 50ms, ranked by popularity, for millions of users. Compare a trie against prefix-indexed n-grams, and explain how you get popularity-ranked suggestions back that fast.
**Verdict:** KEEP — comparative design with a hard latency budget and popularity ranking; full senior arc, rich follow-ups.

### New answer (en)
**TL;DR** — Build a prefix structure over *popular queries*, not the document corpus, and precompute the top-K completions by popularity *at each node*. On a keystroke you walk to the prefix node in O(prefix length) and read the cached top-K directly — no subtree traversal — which is how you hold p99 under 50ms.

**How it works** — A trie maps each prefix to its descendants; the key optimization is caching a small sorted top-K (or heap snapshot) at every node, so query time is just a walk plus a read. The alternative, prefix-indexed n-grams, stores edge n-grams or completion strings keyed by prefix in an inverted index or a search engine's completion suggester — easier to shard, update, and integrate, but heavier on memory and looser on prefix semantics. Either way you serve from memory, debounce keystrokes client-side, and keep hot prefixes cached so the median request never touches disk.

:::muted
**Trade-off** — The trie with cached top-K is blazing to read but rigid to update: recomputing a node's top-K when popularity shifts ripples up every ancestor, favoring periodic batch rebuilds over real-time freshness, and a large in-memory trie is RAM-hungry and must be sharded by prefix. N-gram/suggester indexes update more incrementally and reuse your search cluster — trading some latency and memory bloat for operational simplicity and easier fuzzy/middle-of-string matching. Caching only top-K per node also drops rare long-tail completions, usually acceptable.
:::

:::muted
**Common pitfall** — Unbounded fan-out at short prefixes: a single letter has millions of descendants, so without precomputed top-K you traverse a huge subtree per keystroke and blow the budget. Forgetting client-side debounce hits the backend with a request per character. Stale popularity keeps suggesting yesterday's trends, or worse, queries that now return nothing. And safety/personalization filters (no offensive or out-of-stock suggestions, locale-aware) must be baked into the cached lists, not bolted on at query time.
:::

*Go deeper: how would you add typo tolerance to autocomplete without paying fuzzy-expansion cost on every keystroke?*

**Keywords** — `trie · precomputed top-K · completion suggester · edge n-grams · debounce · prefix sharding · p99`

### New answer (vi)
**Chốt** — Xây cấu trúc prefix trên *các query phổ biến*, không phải corpus tài liệu, và tính trước top-K completion theo popularity *tại mỗi nút*. Khi gõ một phím, bạn đi tới nút prefix trong O(độ dài prefix) và đọc thẳng top-K đã cache — không duyệt subtree — đó là cách giữ p99 dưới 50ms.

**Cơ chế** — Một trie ánh xạ mỗi prefix tới con cháu; tối ưu mấu chốt là cache một top-K nhỏ đã sắp xếp (hoặc snapshot heap) tại mỗi nút, nên query time chỉ là đi tới nút cộng đọc. Phương án thay thế, prefix-indexed n-gram, lưu edge n-gram hoặc chuỗi completion key theo prefix trong inverted index hoặc completion suggester của một search engine — dễ shard, update và tích hợp hơn, nhưng nặng bộ nhớ hơn và ngữ nghĩa prefix lỏng hơn. Dù cách nào, bạn phục vụ từ bộ nhớ, debounce phím phía client, và giữ hot prefix trong cache để request trung vị không chạm disk.

:::muted
**Trade-off** — Trie với top-K đã cache đọc cực nhanh nhưng cứng khi update: tính lại top-K của một nút khi popularity đổi sẽ lan ngược lên mọi tổ tiên, ưu tiên batch rebuild định kỳ hơn tươi real-time, và trie in-memory lớn ngốn RAM, phải shard theo prefix. Index n-gram/suggester update tăng dần hơn và tái dùng search cluster — đánh đổi một phần latency và bộ nhớ phình để lấy đơn giản vận hành và khớp fuzzy/giữa-chuỗi dễ hơn. Chỉ cache top-K mỗi nút cũng bỏ các completion long-tail hiếm, thường chấp nhận được.
:::

:::muted
**Bẫy thường gặp** — Fan-out không giới hạn ở prefix ngắn: một chữ cái có hàng triệu con cháu, nên không có top-K tính trước thì bạn duyệt subtree khổng lồ mỗi phím và vỡ ngân sách. Quên debounce phía client làm backend bị dội một request mỗi ký tự. Popularity cũ cứ gợi ý xu hướng hôm qua, tệ hơn là query giờ chẳng trả gì. Và bộ lọc an toàn/cá nhân hóa (không gợi ý phản cảm hay hết hàng, theo locale) phải bake sẵn vào list đã cache, không gắn thêm lúc query.
:::

*Đào sâu tiếp: làm sao thêm typo tolerance cho autocomplete mà không trả chi phí fuzzy-expansion mỗi phím gõ?*

**Từ khoá ăn điểm** — `trie · precomputed top-K · completion suggester · edge n-grams · debounce · prefix sharding · p99`

## 3-card — senior — [Ranking, BM25]
**Question:** Your search returns the right candidate documents but the ordering feels wrong — users complain the best products aren't at the top. Walk me through how you rank results: where TF-IDF and BM25 fit, when you'd move to learned ranking, and how you blend textual relevance with business signals like sales, rating, and margin without breaking trust.
**Verdict:** KEEP — diagnosis + multi-stage design + business/relevance tension; deep senior question with strong follow-ups.

### New answer (en)
**TL;DR** — Rank in two stages: a cheap lexical scorer (BM25) over the candidate set for retrieval, then a learned re-ranker over only the top few hundred that blends relevance with business signals. Business boosts enter as bounded features so they tilt ordering without overriding relevance.

**How it works** — Stage one (retrieval): TF-IDF weights a term by its frequency in a doc against its rarity across the corpus; BM25 improves it by *saturating* term frequency (the tenth occurrence adds little) and *normalizing for document length*, which is why BM25 is the modern default. Stage two (re-ranking): take the top few hundred and apply a richer model — learning-to-rank (gradient-boosted trees like LambdaMART, or a neural ranker) trained on click/conversion data — combining the BM25 score with rating, sales velocity, recency, in-stock, personalization, and margin. Retrieval stays fast and recall-oriented; you spend compute only on the small re-rank set.

:::muted
**Trade-off** — BM25 is interpretable, cheap, and needs no training data but is blind to semantics; learned ranking captures far more signal but needs labeled/implicit feedback, a feature pipeline, training infra, and monitoring, and can be a black box. Blending business signals trades pure relevance for revenue: boost margin too hard and you surface things users don't want, hurting long-term engagement to chase short-term GMV. Two-stage design itself trades a little recall (anything missed in stage one can't be re-ranked back in) for running an expensive model on a small set.
:::

:::muted
**Common pitfall** — Over-tuning toward business metrics until results feel like ads erodes trust and ultimately conversion — keep a relevance floor. Learned models degrade silently from feedback loops (training on clicks your own ranking biased) and training/serving skew (offline vs online features differ). BM25 has its own traps: untuned `k1`/`b` or skipped length normalization let long documents win unfairly. Always A/B test ranking changes on real engagement and watch for popularity bias crushing new or niche items.
:::

*Go deeper: how do you break the feedback loop where your ranker keeps reinforcing whatever it already put on top?*

**Keywords** — `TF-IDF · BM25 · k1/b · length normalization · learning-to-rank · LambdaMART · two-stage retrieval · relevance floor`

### New answer (vi)
**Chốt** — Xếp hạng hai giai đoạn: một scorer lexical rẻ (BM25) trên tập ứng viên để retrieval, rồi một learned re-ranker chỉ trên vài trăm cái đầu trộn relevance với tín hiệu kinh doanh. Boost kinh doanh đi vào dưới dạng feature có giới hạn để nghiêng thứ tự mà không lấn át relevance.

**Cơ chế** — Giai đoạn một (retrieval): TF-IDF tính trọng số term theo tần suất trong tài liệu so với độ hiếm trên corpus; BM25 cải tiến bằng *bão hòa* term frequency (lần thứ mười thêm rất ít) và *chuẩn hóa theo độ dài tài liệu*, đó là lý do BM25 là default hiện đại. Giai đoạn hai (re-ranking): lấy vài trăm cái đầu và áp một mô hình giàu hơn — learning-to-rank (cây gradient-boosted như LambdaMART, hoặc neural ranker) huấn luyện trên dữ liệu click/conversion — kết hợp điểm BM25 với rating, tốc độ bán, độ mới, còn hàng, cá nhân hóa, và margin. Retrieval giữ nhanh và thiên recall; bạn chỉ tiêu compute cho tập re-rank nhỏ.

:::muted
**Trade-off** — BM25 dễ diễn giải, rẻ, không cần dữ liệu huấn luyện nhưng mù ngữ nghĩa; learned ranking bắt nhiều tín hiệu hơn nhưng cần feedback labeled/ngầm, một feature pipeline, hạ tầng huấn luyện, và giám sát, và có thể là black box. Trộn tín hiệu kinh doanh đánh đổi relevance thuần lấy doanh thu: boost margin quá mạnh thì đẩy lên thứ người dùng không muốn, hại engagement dài hạn để chạy theo GMV ngắn hạn. Thiết kế hai giai đoạn đánh đổi một chút recall (cái bị bỏ sót ở giai đoạn một không re-rank lại được) để chạy một mô hình đắt trên tập nhỏ.
:::

:::muted
**Bẫy thường gặp** — Over-tune theo metric kinh doanh đến mức kết quả như quảng cáo làm xói mòn niềm tin và rốt cuộc cả conversion — giữ một sàn relevance. Mô hình learned xuống cấp âm thầm do feedback loop (huấn luyện trên click đã bị chính ranking làm thiên lệch) và training/serving skew (feature offline khác online). BM25 có bẫy riêng: `k1`/`b` chưa tinh chỉnh hoặc bỏ length normalization làm tài liệu dài thắng không công bằng. Luôn A/B test thay đổi ranking trên engagement thật và để ý popularity bias đè bẹp item mới hoặc ngách.
:::

*Đào sâu tiếp: làm sao phá feedback loop khi ranker cứ củng cố những gì nó đã đặt trên đầu?*

**Từ khoá ăn điểm** — `TF-IDF · BM25 · k1/b · length normalization · learning-to-rank · LambdaMART · two-stage retrieval · relevance floor`

## 4-card — middle — [Typo Tolerance, Edit Distance]
**Question:** Users type "wireles hedphones" and expect to still find wireless headphones. Design typo tolerance for your search. How do you do fuzzy matching with edit distance efficiently, and what does enabling fuzziness cost you in precision and latency that you have to control?
**Verdict:** KEEP — design + efficiency + explicit cost/control trade-off; solid middle-level depth with follow-ups.

### New answer (en)
**TL;DR** — Expand each query term to dictionary terms within a small edit distance (1 for short words, 2 for longer) and search the union of their posting lists. To make candidate generation cheap, use a deletion-neighborhood index (SymSpell), n-gram overlap, or a Levenshtein automaton — never compute distance against every dictionary term.

**How it works** — Computing edit distance against the whole dictionary is too slow, so you shortlist candidates: precompute deletions (SymSpell), use n-gram overlap to find similar terms, or compile a Levenshtein automaton that scans the dictionary and accepts only strings within distance k. Many engines apply fuzziness only when an exact match yields too few results, and scale allowed distance to term length so short terms stay strict. For "hedphones" you generate near terms, find "headphones" within distance 1, and merge its postings into the candidate set — usually down-weighting fuzzy matches so exact matches still rank above corrections.

:::muted
**Trade-off** — Fuzziness directly trades precision and latency for recall: each term expands into many candidates, so you read and merge far more posting lists, and distance 2 on a long word matches an enormous neighborhood. It also introduces false matches, hurting precision. The control levers — bound distance by term length, require a matching prefix (most typos aren't in the first letter), enable fuzziness only when exact recall is low, and penalize fuzzy hits in scoring — each buy back latency or precision at the cost of catching fewer typos.
:::

:::muted
**Common pitfall** — Unbounded fuzziness is the classic latency bomb: distance 2 on short common words explodes the candidate set, and a few such queries can saturate a node. Precision collapses if corrections aren't penalized, so a clean exact query starts surfacing irrelevant near-spellings. It also won't fix phonetic errors ("nife"/"knife"), wrong word splits, or semantic mismatches — those need phonetic algorithms, query rewriting, or synonyms. Applying fuzziness per keystroke in autocomplete is especially dangerous; gate it or you blow the sub-50ms budget.
:::

*Go deeper: how does a Levenshtein automaton accept exactly the terms within distance k without checking each one individually?*

**Keywords** — `Levenshtein/edit distance · SymSpell · deletion neighborhood · Levenshtein automaton · n-gram overlap · prefix constraint · fuzzy penalty`

### New answer (vi)
**Chốt** — Mở rộng mỗi term của query thành các term trong dictionary nằm trong một edit distance nhỏ (1 cho từ ngắn, 2 cho từ dài) rồi tìm trên hợp các posting list. Để sinh ứng viên cho rẻ, dùng deletion-neighborhood index (SymSpell), n-gram overlap, hoặc Levenshtein automaton — đừng tính distance với mọi term trong dictionary.

**Cơ chế** — Tính edit distance với cả dictionary thì quá chậm, nên bạn shortlist ứng viên: tính trước các deletion (SymSpell), dùng n-gram overlap để tìm term tương tự, hoặc biên dịch một Levenshtein automaton quét dictionary và chỉ chấp nhận chuỗi trong khoảng cách k. Nhiều engine chỉ áp fuzziness khi exact match trả về quá ít kết quả, và scale khoảng cách cho phép theo độ dài term để term ngắn vẫn nghiêm ngặt. Với "hedphones" bạn sinh các term gần, tìm thấy "headphones" trong khoảng cách 1, và merge postings của nó vào tập ứng viên — thường giảm trọng số fuzzy match để exact match vẫn xếp trên correction.

:::muted
**Trade-off** — Fuzziness đánh đổi trực tiếp precision và latency để lấy recall: mỗi term nở thành nhiều ứng viên, nên bạn đọc và merge nhiều posting list hơn rất nhiều, và distance 2 trên từ dài khớp một neighborhood khổng lồ. Nó cũng đưa vào false match, hại precision. Các cần điều khiển — chặn distance theo độ dài term, yêu cầu prefix khớp (đa số typo không ở chữ cái đầu), chỉ bật fuzziness khi exact recall thấp, và phạt fuzzy hit trong scoring — mỗi cần mua lại latency hoặc precision với cái giá bắt được ít typo hơn.
:::

:::muted
**Bẫy thường gặp** — Fuzziness không giới hạn là quả bom latency kinh điển: distance 2 trên từ ngắn phổ biến làm nổ tập ứng viên, và vài query như vậy có thể bão hòa một node. Precision sụp đổ nếu correction không bị phạt, nên query exact sạch bắt đầu đẩy lên near-spelling không liên quan. Nó cũng không sửa lỗi phát âm ("nife"/"knife"), tách từ sai, hay sai lệch ngữ nghĩa — cần thêm thuật toán phonetic, query rewriting, hoặc synonym. Áp fuzziness mỗi phím gõ trong autocomplete đặc biệt nguy hiểm; hãy gate nó nếu không sẽ vỡ ngân sách dưới 50ms.
:::

*Đào sâu tiếp: Levenshtein automaton chấp nhận đúng các term trong khoảng cách k mà không cần kiểm từng cái ra sao?*

**Từ khoá ăn điểm** — `Levenshtein/edit distance · SymSpell · deletion neighborhood · Levenshtein automaton · n-gram overlap · prefix constraint · fuzzy penalty`

## 5-card — senior — [Sharding, Scatter-Gather]
**Question:** The index no longer fits on one machine and query volume is climbing. Design how you shard and replicate the inverted index. Explain the scatter-gather query path, how you correctly merge ranked results across shards, and why global scoring is the subtle hard part.
**Verdict:** KEEP — distributed design with a subtle correctness trap (global IDF); full senior arc, strong follow-ups.

### New answer (en)
**TL;DR** — Shard by document (each shard holds a complete inverted index over its own subset of docs) and replicate each shard for availability and read throughput. A coordinator scatters the query to all shards, each returns its local top-K, and the coordinator gathers and k-way-merges them into a global top-K. The subtle hard part is making per-shard scores comparable.

**How it works** — Document sharding keeps each shard self-contained and scales with corpus size. Add replicas to scale reads, add shards to scale corpus, routing each query to one replica per shard. The fan-out means total latency is bounded by the slowest shard, so you size shards to finish local search well within budget. Each shard retrieves and scores its own top-K locally; the coordinator merges sorted per-shard lists into the global top-K.

:::muted
**Trade-off** — Document sharding makes indexing/storage trivially parallel but turns every query into all-shard fan-out, so tail latency is governed by the slowest replica and more shards raise the chance one is slow (tail amplification). Term sharding (each shard owns certain terms) avoids fan-out for single-term queries but forces cross-shard data movement for multi-term intersection and creates hot shards — rarely worth it. Replication trades storage and write amplification for read scalability and fault tolerance.
:::

:::muted
**Common pitfall** — Global scoring: BM25/IDF depend on corpus-wide document frequency, but each shard only sees its own docs, so locally computed IDF differs per shard and naively merging local scores yields inconsistent ranking — you need distributed term statistics or a two-pass approach. The classic operational failure is the straggler: one degraded replica slows every query, mitigated with hedged requests, per-shard timeouts, and health checks. Under-fetching breaks correctness when the true top-K skews onto one shard — request enough per shard. And uneven document distribution creates hot shards, so shard by a balanced key.
:::

*Go deeper: walk me through a concrete two-pass scheme that makes IDF consistent across shards without a full corpus-wide pre-scan per query.*

**Keywords** — `document sharding · scatter-gather · k-way merge · global IDF · distributed term stats · straggler/hedged requests · over-fetch top-K`

### New answer (vi)
**Chốt** — Shard theo document (mỗi shard giữ một inverted index hoàn chỉnh trên tập con tài liệu của mình) và replicate mỗi shard để có availability và read throughput. Một coordinator scatter query tới mọi shard, mỗi cái trả top-K cục bộ, rồi coordinator gather và k-way-merge thành global top-K. Phần khó tinh tế là làm điểm giữa các shard so sánh được.

**Cơ chế** — Sharding theo document giữ mỗi shard tự-đầy-đủ và scale theo kích thước corpus. Thêm replica để scale đọc, thêm shard để scale corpus, route mỗi query tới một replica cho mỗi shard. Fan-out nghĩa là tổng latency bị chặn bởi shard chậm nhất, nên kích cỡ shard để xong local search trong ngân sách. Mỗi shard tự retrieve và score top-K cục bộ; coordinator merge các list đã sắp xếp theo từng shard thành global top-K.

:::muted
**Trade-off** — Sharding theo document làm indexing/lưu trữ song song tầm thường nhưng biến mỗi query thành fan-out tới mọi shard, nên tail latency bị chi phối bởi replica chậm nhất và càng nhiều shard càng tăng khả năng có cái chậm (tail amplification). Term sharding (mỗi shard sở hữu một số term) tránh fan-out cho query một-term nhưng buộc di chuyển dữ liệu cross-shard cho phép giao đa-term và tạo hot shard — hiếm khi đáng. Replication đánh đổi lưu trữ và write amplification để lấy scale đọc và chịu lỗi.
:::

:::muted
**Bẫy thường gặp** — Global scoring: BM25/IDF phụ thuộc document frequency toàn corpus, nhưng mỗi shard chỉ thấy tài liệu của mình, nên IDF tính cục bộ khác nhau theo shard và merge ngây thơ các điểm cục bộ cho ranking không nhất quán — cần thống kê term phân tán hoặc cách tiếp cận hai-pass. Failure vận hành kinh điển là straggler: một replica suy giảm làm mọi query chậm, giảm thiểu bằng hedged request, timeout theo từng shard, và health check. Under-fetch phá tính đúng khi top-K thật dồn lệch vào một shard — hãy yêu cầu đủ mỗi shard. Và phân bố tài liệu không đều tạo hot shard, nên shard theo một key cân bằng.
:::

*Đào sâu tiếp: hãy mô tả một sơ đồ hai-pass cụ thể làm IDF nhất quán qua các shard mà không cần pre-scan toàn corpus mỗi query.*

**Từ khoá ăn điểm** — `document sharding · scatter-gather · k-way merge · global IDF · distributed term stats · straggler/hedged requests · over-fetch top-K`

## 6-card — middle — [Index Freshness, NRT Indexing]
**Question:** When a seller updates a product price or marks it out of stock, how quickly should that show up in search, and how do you keep the index fresh? Compare near-real-time indexing against batch rebuilds, and explain the read/write trade-off that makes "instant freshness" expensive.
**Verdict:** KEEP — freshness SLA + NRT-vs-batch comparison + read/write tension; strong middle-level question with follow-ups.

### New answer (en)
**TL;DR** — Drive indexing off a change stream (CDC or an event bus) and pick a freshness SLA per use case — out-of-stock should propagate in seconds, a mapping-change reindex can be a periodic batch. NRT engines make new docs searchable within a second or two via a periodic refresh; "instant" is expensive because every write costs analysis, segment creation, and merging that compete with queries.

**How it works** — Product updates emit events; an indexing pipeline consumes them, re-analyzes the affected docs, and writes them in. For NRT, incoming docs go into small in-memory segments made searchable by a periodic refresh while durable on-disk segments merge in the background — how Lucene-based systems (Elasticsearch, Solr) offer sub-second visibility. Because segments are immutable, an update is delete-plus-insert: the old doc is tombstoned and a new segment holds the new version.

:::muted
**Trade-off** — The core read/write tension: the inverted index is optimized for fast reads, so every write costs analysis, segment creation, and merging, and pushing freshness toward real-time multiplies that overhead, consuming CPU/IO that competes with query serving. Frequent refreshes create many tiny segments that slow queries until merged; infrequent refreshes save resources but increase staleness. Batch rebuilds are throughput-efficient and produce clean, compacted segments (great for read latency) but leave the index minutes-to-hours stale.
:::

:::muted
**Common pitfall** — The dominant failure is indexing lag: a backlog, slow consumer, or merge storm leaves search serving stale data while the DB is correct, so monitor end-to-end indexing latency, not just queue depth. Refreshing too aggressively triggers segment-count explosion and merge thrash that tanks query latency — a self-inflicted outage. Delete-plus-insert accumulates tombstones that bloat the index until merges reclaim them, so heavy-update workloads need a merge policy bounding deleted-doc ratios. And out-of-order events can resurrect a deleted doc — version each document and drop stale updates.
:::

*Go deeper: how do you guarantee an out-of-order "back in stock" then "out of stock" pair ends with the right state in the index?*

**Keywords** — `CDC/change stream · NRT refresh · immutable segments · delete-plus-insert/tombstones · merge policy · indexing lag · document versioning`

### New answer (vi)
**Chốt** — Lái indexing từ một change stream (CDC hoặc event bus) và chọn freshness SLA theo từng use case — hết hàng nên lan truyền trong vài giây, reindex do đổi mapping có thể là batch định kỳ. Engine NRT làm tài liệu mới tìm được trong một hai giây qua một refresh định kỳ; "tức thì" đắt vì mỗi lần ghi tốn analysis, tạo segment, và merge cạnh tranh với query.

**Cơ chế** — Cập nhật sản phẩm phát event; một pipeline indexing tiêu thụ chúng, phân tích lại tài liệu bị ảnh hưởng, và ghi vào. Với NRT, tài liệu đến vào các segment in-memory nhỏ được làm tìm-được qua một refresh định kỳ trong khi segment bền vững trên disk merge ở background — cách các hệ thống dựa trên Lucene (Elasticsearch, Solr) cho khả năng thấy dưới một giây. Vì segment bất biến, một update là delete-cộng-insert: tài liệu cũ bị tombstone và một segment mới giữ phiên bản mới.

:::muted
**Trade-off** — Căng thẳng read/write cốt lõi: inverted index tối ưu cho đọc nhanh, nên mỗi lần ghi tốn analysis, tạo segment, và merge, và đẩy độ tươi về real-time nhân lên overhead đó, ngốn CPU/IO cạnh tranh với việc phục vụ query. Refresh thường xuyên tạo nhiều segment tí hon làm chậm query cho đến khi merge; refresh thưa tiết kiệm tài nguyên nhưng tăng staleness. Batch rebuild hiệu quả về throughput và tạo segment sạch, nén tốt (tuyệt cho read latency) nhưng để index cũ vài phút đến vài giờ.
:::

:::muted
**Bẫy thường gặp** — Failure chủ đạo là indexing lag: một backlog, consumer chậm, hay cơn bão merge để search phục vụ dữ liệu cũ trong khi DB vẫn đúng, nên giám sát latency indexing end-to-end, không chỉ độ sâu queue. Refresh quá hung hăng gây bùng nổ số segment và merge thrash làm tụt query latency — một sự cố tự gây. Delete-cộng-insert tích lũy tombstone làm phình index cho đến khi merge thu hồi, nên workload update nặng cần một merge policy chặn tỉ lệ deleted-doc. Và event sai thứ tự có thể hồi sinh một tài liệu đã xóa — version mỗi tài liệu và bỏ update cũ.
:::

*Đào sâu tiếp: làm sao đảm bảo cặp event sai thứ tự "back in stock" rồi "out of stock" kết thúc với đúng trạng thái trong index?*

**Từ khoá ăn điểm** — `CDC/change stream · NRT refresh · immutable segments · delete-plus-insert/tombstones · merge policy · indexing lag · document versioning`

## 7-card — staff — [System Design, Architecture]
**Question:** Put it all together: design the end-to-end search platform for a large marketplace — ingestion, indexing, the query path, ranking, and autocomplete — serving tens of thousands of queries per second over hundreds of millions of documents. How do the pieces fit, where are the bottlenecks, and what do you trade off to keep it fast, fresh, and relevant at scale?
**Verdict:** KEEP — capstone, end-to-end architecture with systemic bottlenecks and per-component SLAs; full staff arc.

### New answer (en)
**TL;DR** — Split into a write path and a read path joined by the index. Write path: changes flow via CDC/event bus into an indexing pipeline that writes a document-sharded, replicated, NRT inverted index. Read path: analyze query → scatter to shards → cheap BM25 retrieval → gather top-K → heavy learned re-rank. Autocomplete is a separate in-memory prefix service. The guiding principle is cheap-and-wide retrieval first, expensive-and-narrow ranking second, freshness async off the write path.

**How it works** — On write, documents are normalized, enriched, and analyzed, then written into a document-sharded, replicated index with NRT refresh. On read, a query service tokenizes, spell-corrects, and expands synonyms; a coordinator scatters to all shards; each shard retrieves and scores candidates with BM25; the coordinator gathers per-shard top-K and applies a learned re-ranker blending relevance with business signals over the small merged set. Autocomplete is backed by an in-memory prefix structure of popular queries with cached top-K, refreshed from query logs. Wrap it all with result/autocomplete caching, aggressive timeouts, and partial-result tolerance.

:::muted
**Trade-off** — Every layer is a deliberate trade. The index is derived and eventually consistent — you accept staleness for read speed. Document sharding buys parallel indexing and corpus scaling at the price of all-shard fan-out and tail latency. Two-stage ranking buys cheap recall plus precise re-ranking at the price of stage-one recall loss and an ML pipeline to maintain. Caching buys throughput at the price of invalidation complexity. NRT buys quick visibility at the price of write/merge overhead. The art is choosing per-component SLAs — freshness, p99, relevance quality — and provisioning to hit them without overspending.
:::

:::muted
**Common pitfall** — At this scale failures are systemic. Tail latency dominates — one slow replica slows every query — so use hedged requests, per-shard timeouts, and partial results. The indexing pipeline is a silent single point of staleness: lag or a poison message stalls freshness while everything looks healthy, so monitor end-to-end indexing latency and make it idempotent and replayable. Ranking degrades from feedback loops and training/serving skew — A/B test and keep a relevance floor. Hot shards/queries concentrate load — balanced sharding plus caching. And the DB and index drift — build reconciliation and a no-downtime full-reindex path.
:::

*Go deeper: when you discover the index is silently wrong, how do you run a full reindex and cut over with zero downtime and no relevance regression?*

**Keywords** — `write/read path split · document sharding · BM25 retrieval + learned re-rank · NRT/CDC · hedged requests/partial results · reconciliation · per-component SLAs`

### New answer (vi)
**Chốt** — Chia thành một write path và một read path nối bởi index. Write path: thay đổi chảy qua CDC/event bus vào một pipeline indexing ghi một inverted index đã shard-theo-document, replicate, NRT. Read path: phân tích query → scatter tới shard → retrieval BM25 rẻ → gather top-K → learned re-rank nặng. Autocomplete là một service prefix in-memory riêng. Nguyên tắc chỉ đạo là retrieval rẻ-và-rộng trước, ranking đắt-và-hẹp sau, độ tươi async khỏi write path.

**Cơ chế** — Trên write, tài liệu được chuẩn hóa, làm giàu, và phân tích, rồi ghi vào một index đã shard-theo-document, replicate, với refresh NRT. Trên read, một query service tokenize, sửa chính tả, và mở rộng synonym; một coordinator scatter tới mọi shard; mỗi shard retrieve và score ứng viên bằng BM25; coordinator gather top-K theo từng shard và áp một learned re-ranker trộn relevance với tín hiệu kinh doanh trên tập đã merge nhỏ. Autocomplete dựa trên một cấu trúc prefix in-memory của query phổ biến với top-K đã cache, refresh từ query log. Bọc tất cả bằng caching kết quả/autocomplete, timeout hung hăng, và khả năng chịu kết quả từng phần.

:::muted
**Trade-off** — Mỗi tầng là một đánh đổi có chủ đích. Index dẫn xuất và eventually consistent — bạn chấp nhận staleness để lấy tốc độ đọc. Sharding theo document mua indexing song song và scale corpus với cái giá fan-out tới mọi shard và tail latency. Ranking hai giai đoạn mua recall rẻ cộng re-ranking chính xác với cái giá mất recall ở giai đoạn một và một ML pipeline phải duy trì. Caching mua throughput với cái giá độ phức tạp invalidation. NRT mua khả năng thấy nhanh với cái giá overhead write/merge. Nghệ thuật là chọn SLA theo từng component — độ tươi, p99, chất lượng relevance — và cấp phát để đạt chúng mà không tiêu quá mức.
:::

:::muted
**Bẫy thường gặp** — Ở quy mô này các failure mang tính hệ thống. Tail latency chi phối — một replica chậm làm chậm mọi query — nên dùng hedged request, timeout theo từng shard, và kết quả từng phần. Pipeline indexing là một single point of staleness âm thầm: lag hoặc một poison message làm đứng độ tươi trong khi mọi thứ trông khỏe mạnh, nên giám sát latency indexing end-to-end và làm nó idempotent và replayable. Ranking xuống cấp do feedback loop và training/serving skew — A/B test và giữ một sàn relevance. Hot shard/query dồn tải — sharding cân bằng cộng caching. Và DB với index trôi lệch — xây reconciliation và một đường full-reindex không downtime.
:::

*Đào sâu tiếp: khi phát hiện index sai âm thầm, làm sao chạy full reindex và cut over với zero downtime mà không tụt relevance?*

**Từ khoá ăn điểm** — `write/read path split · document sharding · BM25 retrieval + learned re-rank · NRT/CDC · hedged requests/partial results · reconciliation · per-component SLAs`
