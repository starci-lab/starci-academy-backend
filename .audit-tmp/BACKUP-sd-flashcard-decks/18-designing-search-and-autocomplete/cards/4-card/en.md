# question
<!-- @starci/seperator -->
Users type "wireles hedphones" and expect to still find wireless headphones. Design typo tolerance for your search. How do you do fuzzy matching with edit distance efficiently, and what does enabling fuzziness cost you in precision and latency that you have to control?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Typo Tolerance
## 1
<!-- @starci/seperator -->
Edit Distance
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Fuzzy matching expands each query term to the set of dictionary terms within a small Levenshtein (edit) distance — usually 1 for short words and 2 for longer ones — then searches the union of their posting lists. Computing edit distance against every term in the dictionary is too slow, so you make candidate generation cheap: precompute a deletion-neighborhood index (SymSpell style), or use n-gram overlap to shortlist similar terms, or compile a Levenshtein automaton that scans the term dictionary and accepts only strings within distance k. Many engines apply fuzziness only when an exact match yields too few results, and scale the allowed distance to term length so short terms stay strict. For "hedphones" you generate near terms, find "headphones" within distance 1, and merge its postings into the candidate set, optionally down-weighting fuzzy matches so exact matches still rank above corrections.
:::

:::muted
**Trade-off** — Fuzziness directly trades precision and latency for recall: every term expands into many candidate terms, so you read and merge far more posting lists, inflating query cost — distance 2 on a long word can match an enormous neighborhood. It also introduces false matches (correcting "iphone" toward "phone" or matching an unrelated near-spelling), hurting precision. The control levers are bounding edit distance by term length, requiring a matching prefix (most typos aren't in the first letter), only enabling fuzziness when exact recall is low, and penalizing fuzzy hits in scoring so corrections never outrank exact matches. Each lever buys back latency or precision at the cost of catching fewer typos.
:::

:::muted
**Pitfall & Failure mode** — Unbounded fuzziness is the classic latency bomb: allowing distance 2 on short common words explodes the candidate set and the per-query merge cost, and a few such queries can saturate a node. Precision collapses when corrections are not penalized, so a clean exact-match query starts surfacing irrelevant near-spellings. Typo tolerance also doesn't fix everything — it won't handle phonetic errors ("nife" for "knife"), wrong word splits, or semantic mismatches, which need additional tools (phonetic algorithms, query rewriting, synonyms). Finally, applying fuzziness to autocomplete on every keystroke is especially dangerous because you pay the expansion cost per character; gate it carefully or you blow the sub-50ms budget.
:::
<!-- @starci/seperator -->
