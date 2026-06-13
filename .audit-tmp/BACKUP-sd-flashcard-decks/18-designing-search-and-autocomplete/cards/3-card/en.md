# question
<!-- @starci/seperator -->
Your search returns the right candidate documents but the ordering feels wrong — users complain the best products aren't at the top. Walk me through how you rank results: where TF-IDF and BM25 fit, when you'd move to learned ranking, and how you blend textual relevance with business signals like sales, rating, and margin without breaking trust.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Ranking
## 1
<!-- @starci/seperator -->
BM25
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Rank in two stages. Stage one (retrieval) uses a cheap lexical scorer over the candidate set: TF-IDF weights a term by how often it appears in a document against how rare it is across the corpus, and BM25 improves on it by saturating term frequency (the tenth occurrence adds little) and normalizing for document length, which is why BM25 is the modern default. Stage two (re-ranking) takes the top few hundred candidates and applies a richer model — a learned-to-rank model (gradient-boosted trees like LambdaMART, or a neural ranker) trained on click and conversion data — that combines the BM25 score with features like rating, sales velocity, recency, in-stock status, personalization, and margin. You keep retrieval fast and recall-oriented, then spend compute only on a small set during precise re-ranking. Business signals enter as bounded features or multiplicative boosts so they tilt ordering without overriding relevance.
:::

:::muted
**Trade-off** — Lexical scoring (BM25) is interpretable, cheap, and needs no training data, but it is blind to semantics and intent; learned ranking captures far more signal but needs labeled or implicit feedback data, a feature pipeline, training infrastructure, and careful monitoring, and it can be a black box. Mixing in business signals trades pure relevance for revenue: boost margin too hard and you surface products users do not want, hurting long-term engagement to chase short-term GMV. The two-stage design itself trades a little recall (anything missed in stage one can never be re-ranked back in) for the ability to run an expensive model on a small candidate set.
:::

:::muted
**Pitfall & Failure mode** — The headline failure is over-tuning toward business metrics until results feel like ads, eroding user trust and ultimately conversion — the "relevance must dominate" guardrail exists for a reason. Learned models silently degrade from feedback loops (you train on clicks that your own ranking biased, reinforcing whatever is already on top) and from training/serving skew when features computed offline differ from online. BM25 has its own traps: untuned `k1`/`b` parameters, or skipping length normalization, make long documents win unfairly. Always A/B test ranking changes on real engagement, watch for popularity bias crushing new or niche items, and keep a relevance floor so business boosts can reorder good matches but never inject bad ones.
:::
<!-- @starci/seperator -->
