import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Topic domain for a LeetCode-style coding problem -- the primary interview
 * category used to group the problem bank (e.g. arrays, graph, dynamic
 * programming). Stored in `coding_problems.domain`.
 *
 * The full taxonomy of interview-common domains is enumerated here even when a
 * domain has no problems yet, so the UI can render a stable, complete grouping.
 */
export enum CodingDomain {
    /** Contiguous index-addressable collections; scans, prefix sums, in-place tricks. */
    Arrays = "arrays",
    /** Text processing; parsing, pattern matching, character counting. */
    Strings = "strings",
    /** Hash maps/sets for O(1) lookup, frequency counting, deduplication. */
    Hashing = "hashing",
    /** Converging/diverging index pointers over sorted or paired data. */
    TwoPointers = "twoPointers",
    /** Fixed/variable window over a sequence for subarray/substring problems. */
    SlidingWindow = "slidingWindow",
    /** LIFO structures; matching, monotonic stacks, expression evaluation. */
    Stack = "stack",
    /** FIFO structures; BFS frontiers, streaming windows. */
    Queue = "queue",
    /** Pointer-based linear lists; reversal, cycle detection, merging. */
    LinkedList = "linkedList",
    /** Hierarchical node structures; traversals, BST properties, recursion. */
    Trees = "trees",
    /** Priority queues; top-k, scheduling, streaming medians. */
    Heap = "heap",
    /** Vertices and edges; BFS/DFS, shortest paths, connectivity, topological order. */
    Graph = "graph",
    /** Logarithmic search over sorted/monotonic spaces. */
    BinarySearch = "binarySearch",
    /** Ordering data; comparator design, counting/bucket sorts. */
    Sorting = "sorting",
    /** Self-referential decomposition of a problem. */
    Recursion = "recursion",
    /** Systematic search with pruning over a decision tree. */
    Backtracking = "backtracking",
    /** Overlapping subproblems + optimal substructure; memoization/tabulation. */
    DynamicProgramming = "dynamicProgramming",
    /** Locally optimal choices that yield a global optimum. */
    Greedy = "greedy",
    /** Number theory, combinatorics, arithmetic, geometry. */
    Math = "math",
    /** Bitwise operations; masks, parity, low-level tricks. */
    BitManipulation = "bitManipulation",
    /** 2D grid problems; traversal, rotation, dynamic programming on grids. */
    Matrix = "matrix",
}

/** GraphQL enum wrapper for {@link CodingDomain}. */
export const GraphQLTypeCodingDomain = createEnumType(CodingDomain)

registerEnumType(
    GraphQLTypeCodingDomain,
    {
        name: "CodingDomain",
        description: "Primary interview topic domain for a coding-practice problem.",
        valuesMap: {
            [CodingDomain.Arrays]: {
                description: "Array / list manipulation.",
            },
            [CodingDomain.Strings]: {
                description: "String processing.",
            },
            [CodingDomain.Hashing]: {
                description: "Hash map / set lookups.",
            },
            [CodingDomain.TwoPointers]: {
                description: "Two-pointer technique.",
            },
            [CodingDomain.SlidingWindow]: {
                description: "Sliding-window technique.",
            },
            [CodingDomain.Stack]: {
                description: "Stack (LIFO) problems.",
            },
            [CodingDomain.Queue]: {
                description: "Queue (FIFO) problems.",
            },
            [CodingDomain.LinkedList]: {
                description: "Linked-list problems.",
            },
            [CodingDomain.Trees]: {
                description: "Tree problems.",
            },
            [CodingDomain.Heap]: {
                description: "Heap / priority-queue problems.",
            },
            [CodingDomain.Graph]: {
                description: "Graph problems.",
            },
            [CodingDomain.BinarySearch]: {
                description: "Binary-search problems.",
            },
            [CodingDomain.Sorting]: {
                description: "Sorting problems.",
            },
            [CodingDomain.Recursion]: {
                description: "Recursion problems.",
            },
            [CodingDomain.Backtracking]: {
                description: "Backtracking problems.",
            },
            [CodingDomain.DynamicProgramming]: {
                description: "Dynamic-programming problems.",
            },
            [CodingDomain.Greedy]: {
                description: "Greedy problems.",
            },
            [CodingDomain.Math]: {
                description: "Math problems.",
            },
            [CodingDomain.BitManipulation]: {
                description: "Bit-manipulation problems.",
            },
            [CodingDomain.Matrix]: {
                description: "Matrix / 2D-grid problems.",
            },
        },
    },
)
