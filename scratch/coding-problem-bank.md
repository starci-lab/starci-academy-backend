# Big-Corp Interview Coding Problem Bank (research synthesis, 2026-06-11)

Source: 5 parallel research agents over LeetCode / Blind 75 / NeetCode 150 / Grind 75 /
seanprashad patterns. Difficulty maps to our 3 tiers: **medium = Mid, hard = Senior**
(junior/easy already covered by the existing 51 easy problems). Cross-domain duplicates
resolved to ONE home. Problems that collide with an existing easy slug are dropped (noted).

Legend: **(H)** = Senior/hard anchor. LC# in parens.

## arrays (medium)
- Product of Array Except Self (238) — prefix×suffix, no division
- Longest Consecutive Sequence (128) — hash set, expand from run-starts → O(n)
- Merge Intervals (56) — sort by start + sweep merge
- Maximum Subarray / Kadane (53) — running local-vs-global DP
- Insert Interval (57) — three-phase interval splice

## strings (medium + 1 senior already authored)
- Longest Substring Without Repeating (3) — variable window + last-seen map
- Longest Repeating Character Replacement (424) — window valid while len−maxFreq ≤ k
- Group Anagrams (49) — canonical-key hashing (sorted/char-count)
- Find All Anagrams (438) — fixed window + count match
- Longest Palindromic Substring (5) — expand around center
- **minimum-window-substring (76) (H) — ALREADY AUTHORED (gold standard)**

## hashing (medium)
- Subarray Sum Equals K (560) — prefix sum + count map (negatives break window)
- Continuous Subarray Sum (523) — prefix sum mod k + first-index
- Maximum Size Subarray Sum = k (325) — prefix sum + first-occurrence
- 4Sum II (454) — meet-in-the-middle hashmap O(n²)
- Valid Sudoku (36) — composite-key hash sets

## twoPointers (medium + 1 senior)
- 3Sum (15) — sort + converging pointers + dedup
- Container With Most Water (11) — converging pointers, move-shorter greedy
- 3Sum Closest (16) — converging pointers, track best gap
- Valid Palindrome II (680) — converge + single-deletion branch
- **Trapping Rain Water (42) (H)** — two pointers + running max both sides

## slidingWindow (medium + 1 senior)
- Permutation in String (567) — fixed window + 26-count match
- Fruit Into Baskets (904) — longest window ≤ 2 distinct
- Minimum Size Subarray Sum (209) — shrink window on positive sums
- **Sliding Window Maximum (239) (H)** — monotonic deque

## stack (medium + 1 senior)  [daily-temperatures exists easy → skip]
- Evaluate Reverse Polish Notation (150) — operand stack
- Decode String (394) — two stacks (count + string)
- Asteroid Collision (735) — stack simulation
- Min Stack (155) — auxiliary min-stack invariant
- **Largest Rectangle in Histogram (84) (H)** — monotonic increasing stack

## queue (medium)
- Design Circular Queue (622) — ring buffer + modulo
- Moving Average from Data Stream (346) — FIFO window + running sum
- Number of Recent Calls (933) — sliding-time-window queue
- Implement Stack using Queues (225) — queue-only stack
- Design Hit Counter (362) — time-bucketed queue

## linkedList (medium + 1 senior)  [input = space-separated values, build list internally]
- Reorder List (143) — find-mid + reverse + weave
- Add Two Numbers (2) — digit carry traversal
- Copy List with Random Pointer (138) — interleave-clone
- Remove Nth Node From End (19) — two-pointer fixed gap
- LRU Cache (146) — hashmap + doubly linked list (flagship design)
- **Merge k Sorted Lists (23) (H)** — min-heap k-way merge

## trees (medium + 2 senior)  [input = level-order array with `null`]
- Binary Tree Level Order Traversal (102) — BFS by level
- Lowest Common Ancestor (236) — postorder split-point
- Validate BST (98) — min/max bounds DFS
- Kth Smallest in BST (230) — inorder early-stop
- **Binary Tree Maximum Path Sum (124) (H)** — postorder gain + global max
- **Serialize and Deserialize Binary Tree (297) (H)** — preorder encode/decode

## heap (medium + 1 senior)
- Kth Largest Element in Array (215) — size-k heap / quickselect
- Task Scheduler (621) — greedy + max-heap cooldown
- Top K Frequent Elements (347) — counts + bucket sort
- **Find Median from Data Stream (295) (H)** — two heaps

## graph (medium + 2 senior)  [input = `n m` then edges `u v [w]`, or grid]
- Number of Islands (200) — grid flood fill
- Course Schedule II (210) — topological sort (Kahn)
- Connected Components / Union-Find (323) — union-find
- Network Delay Time (743) — Dijkstra
- **Alien Dictionary (269) (H)** — derive graph + topo-sort
- **Word Ladder (127) (H)** — implicit-graph BFS

## binarySearch (medium + 2 senior)  ⭐ binary-search-on-answer family
- Search in Rotated Sorted Array (33) — modified binary search
- Find Minimum in Rotated Sorted Array (153) — pivot binary search
- Koko Eating Bananas (875) ⭐ — binary search on answer
- Capacity To Ship Packages (1011) ⭐ — binary search on answer
- **Split Array Largest Sum (410) (H) ⭐** — minimize-the-max
- **Median of Two Sorted Arrays (4) (H)** — binary search on partition

## sorting (medium)  [sort-colors exists easy → skip]
- Largest Number (179) — custom comparator (a+b vs b+a)
- Meeting Rooms II (253) — sort + min-heap concurrency
- Sort an Array (912) — implement merge/heap sort from scratch

## recursion (medium)  [generate-parentheses exists easy → skip]
- Pow(x, n) (50) — fast exponentiation
- Different Ways to Add Parentheses (241) — D&C on expression
- Strobogrammatic Number II (247) — build outward by length

## backtracking (medium + 1 senior)  [subsets exists easy → skip]
- Permutations (46) — used-set backtracking
- Combination Sum (39) — combinations with reuse
- Palindrome Partitioning (131) — partition + palindrome check
- Word Search (79) — grid DFS backtracking
- **N-Queens (51) (H)** — constraint backtracking (count variant for deterministic output)

## dynamicProgramming (medium + 1 senior)  [house-robber/climbing-stairs/fibonacci exist easy → skip]
- Coin Change (322) — unbounded knapsack (min coins)
- Partition Equal Subset Sum (416) — 0/1 knapsack subset-sum
- Unique Paths (62) — 2D grid DP
- Longest Increasing Subsequence (300) — LIS (O(n²) / patience)
- Edit Distance (72) — 2D string DP (Levenshtein)
- Longest Common Subsequence (1143) — 2D string DP base
- **Burst Balloons (312) (H)** — interval DP (last-to-burst)

## greedy (medium)  [jump-game/best-time-to-buy exist easy → Jump Game II is distinct]
- Jump Game II (45) — reachability frontier (min jumps)
- Gas Station (134) — circular running-deficit reset
- Partition Labels (763) — last-occurrence interval merge
- Non-overlapping Intervals (435) — interval scheduling (sort by end)
- Valid Parenthesis String (678) — low/high open-count range

## math (medium)  [palindrome-number/fizzbuzz exist easy]
- Factorial Trailing Zeroes (172) — count powers of 5
- Integer to Roman (12) — greedy value→symbol table
- Multiply Strings (43) — grade-school digit-array multiply

## bitManipulation (medium)  [number-of-1-bits/power-of-two/single-number exist easy]
- Single Number II (137) — per-bit mod-3 counting
- Single Number III (260) — XOR + lowest-set-bit partition
- Sum of Two Integers (371) — XOR sum + AND<<1 carry
- Maximum XOR of Two Numbers (421) — bitwise trie / greedy prefix

## matrix (medium)  [spiral/rotate-image/set-matrix-zeroes exist easy → use the variants]
- Spiral Matrix II (59) — boundary fill (write 1..n²)
- Game of Life (289) — in-place 2-bit state encoding
- Diagonal Traverse (498) — diagonal direction toggle

---

### Totals
~80 medium/senior problems across 20 domains (after dropping easy-slug collisions).
Senior (hard) anchors: 76✓, 42, 239, 84, 23, 124, 297, 295, 269, 127, 410, 4, 51, 312
(14 hard). Plenty to fill a strong bank; first batch can take the ~14 hard anchors +
2 medium per domain.
