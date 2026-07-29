# Regex Pattern Parsing

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [crates/globset/src/glob.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs)
- [crates/globset/src/lib.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs)
- [crates/regex/src/literal.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs)
- [crates/index/src/literal.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs)
- [crates/core/flags/defs.rs](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs)
</details>

## Overview

Regex pattern parsing serves as the foundational translation and optimization layer in ripgrep and globset, transforming raw user-supplied search patterns, glob syntax expressions, and file filters into structured intermediate representations and compiled automata. By converting syntactic constructs into validated abstract syntax trees, compiling them into high-performance regular expression engines, extracting inner and boundary literal sequences for rapid prefiltering, and generating ngram index queries, pattern parsing bridges high-level user intent with high-throughput search execution while enforcing strict engine limits and configuration options.

Sources: [crates/globset/src/glob.rs:70-81](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L70-L81), [crates/globset/src/lib.rs:306-312](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L306-L312), [crates/regex/src/literal.rs:39-42](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L39-L42), [crates/index/src/literal.rs:320-326](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L320-L326)

## Glob Syntax Parsing and AST

### Overview

Glob pattern parsing transforms raw shell glob strings into structured abstract syntax trees (`Tokens`) and optimized regular expression representations. The compilation pipeline coordinates pattern validation, tokenization, structural option enforcement, and regular expression lowering across `GlobBuilder`, `Parser`, and `Tokens`.

Sources: [crates/globset/src/glob.rs:70-81](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L70-L81), [crates/globset/src/glob.rs:578-610](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L578-L610)

### Parsing Pipeline and Call Chain

The parsing procedure executes via a specific method call sequence when compiling a pattern. When `GlobBuilder::build` is invoked, it constructs a `Parser` instance and executes `Parser::parse`, which drives the character iterator through a sequence of tokenization and structuring functions.

Sources: [crates/globset/src/glob.rs:578-590](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L578-L590)

The call-chain execution walkthrough proceeds as follows: `GlobBuilder::build()` → `Parser::parse()` → character dispatcher (`parse_star()` → `pop_token()` / `push_token()`, `parse_class()`, `push_alternate()`, `pop_alternate()`, `parse_comma()`, `parse_backslash()`) → `Tokens::to_regex_with()` → `tokens_to_regex()`. During this traversal, `Parser::parse` inspects each character via `Parser::bump`, delegating complex syntax constructs to specialized handlers like `parse_star` for recursive wildcards and `parse_class` for character classes, before lowering the finalized token vector into a regular expression string via `Tokens::to_regex_with`.

Sources: [crates/globset/src/glob.rs:579-609](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L579-L609), [crates/globset/src/glob.rs:673-690](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L673-L690), [crates/globset/src/glob.rs:823-837](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L823-L837)

> [!NOTE]
> During class parsing in `Parser::parse_class`, if an unclosed character class is encountered and `GlobOptions::allow_unclosed_class` is enabled, the parser rolls back its internal character iterator state (`self.chars = saved_chars`), sets `found_unclosed_class = true`, and treats the opening `[` as a literal token rather than failing with an error.

Sources: [crates/globset/src/glob.rs:964-1005](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L964-L1005)

### Token Syntax and Options Reference

Glob syntax expressions are translated into distinct AST tokens, governed by configurable matching semantics defined in `GlobOptions`.

Sources: [crates/globset/src/glob.rs:219-237](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L219-L237), [crates/globset/src/glob.rs:268-279](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L268-L279)

| Token Variant | Syntax Representation | Regex Expansion (`literal_separator` = false) | Regex Expansion (`literal_separator` = true) |
| --- | --- | --- | --- |
| `Token::Literal(char)` | Escaped or raw character | Escaped literal sequence | Escaped literal sequence |
| `Token::Any` | `?` | `.` | `[^/]` |
| `Token::ZeroOrMore` | `*` | `.*` | `[^/]*` |
| `Token::RecursivePrefix` | `**` (at start) | `(?:/?|./*)` | `(?:/?|./*)` |
| `Token::RecursiveSuffix` | `**` (at end) | `/.*` | `/.*` |
| `Token::RecursiveZeroOrMore` | `/**/` | `(?:/\|/.*/)` | `(?:/\|/.*/)` |
| `Token::Class` | `[abc]`, `[!a-z]` | `[abc]` / `[^a-z]` | `[abc]` / `[^a-z]` |
| `Token::Alternates` | `{a,b}` | `(?:a\|b)` | `(?:a\|b)` |

Sources: [crates/globset/src/glob.rs:270-279](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L270-L279), [crates/globset/src/glob.rs:700-760](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/glob.rs#L700-L760)

## GlobSet Matching Strategy Construction

### Overview

The `GlobSet` compilation process transforms a collection of individual glob patterns into a unified set of optimized matching strategies. Rather than running every glob pattern independently against a path, `GlobSet::new` inspects each pattern's classification via `MatchStrategy::new(p)` and routes it into specialized lookup engines. These strategies include exact path lookup tables (`LiteralStrategy`), filename tables (`BasenameLiteralStrategy`), file extension buckets (`ExtensionStrategy`), overlapping string searchers (`PrefixStrategy` and `SuffixStrategy`), extension-filtered regexes (`RequiredExtensionStrategy`), and full compiled regex sets (`RegexSetStrategy`).

Sources: [crates/globset/src/lib.rs:461-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L553)

### Match Strategy Construction Call Chain

When building a glob set, patterns undergo classification and sorting into dedicated strategy buckets.

Sources: [crates/globset/src/lib.rs:461-470](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L461-L470)

The execution walkthrough follows this path: `GlobSet::new()` → peeks iterator (returns early via `GlobSet::empty()` if empty) → iterates over globs with index `i` → `MatchStrategy::new(p)` classifies the glob → routes to specific builders or strategy collections (`lits.add()`, `base_lits.add()`, `exts.add()`, `prefixes.add()`, `suffixes.add()`, `required_exts.add()`, `regexes.add()`) → compiles populated strategies via `required_exts.build()?` or `regexes.regex_set()?` → constructs and returns `GlobSet { len, strats }`.

Sources: [crates/globset/src/lib.rs:471-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L471-L553)

> [!NOTE]
> During `GlobSet::new` construction, if a pattern is classified as `MatchStrategy::Suffix { suffix, component }` and `component` is true, the suffix is additionally added as a path literal strategy (`lits.add(i, suffix[1..].to_string())`), allowing exact path hits to bypass heavy suffix iteration.

Sources: [crates/globset/src/lib.rs:496-501](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L496-L501)

### GlobSet Match Strategy Reference

The following table summarizes the strategy variants implemented in `GlobSetMatchStrategy`, their underlying data structures, and their matching mechanisms.

Sources: [crates/globset/src/lib.rs:654-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L654-L662)

| Strategy Variant | Underlying Data Structure | Matching Mechanism |
| --- | --- | --- |
| `Literal` | `LiteralStrategy` (`fnv::HashMap<Vec<u8>, Vec<usize>>`) | Direct hash lookup on candidate path bytes |
| `BasenameLiteral` | `BasenameLiteralStrategy` (`fnv::HashMap<Vec<u8>, Vec<usize>>`) | Hash lookup on candidate basename bytes |
| `Extension` | `ExtensionStrategy` (`fnv::HashMap<Vec<u8>, Vec<usize>>`) | Hash lookup on candidate extension bytes |
| `Prefix` | `PrefixStrategy` (`AhoCorasick`, `Vec<usize>`, `longest`) | Overlapping Aho-Corasick prefix search with start offset 0 |
| `Suffix` | `SuffixStrategy` (`AhoCorasick`, `Vec<usize>`, `longest`) | Overlapping Aho-Corasick suffix search matching path length |
| `RequiredExtension` | `RequiredExtensionStrategy` (`fnv::HashMap<Vec<u8>, Vec<(usize, Regex)>>`) | Extension hash lookup followed by regex matching |
| `Regex` | `RegexSetStrategy` (`Regex`, `Vec<usize>`, `ArcoolatternSet>>`) | Unified regex set matching with pooled `PatternSet` guards |

Sources: [crates/globset/src/lib.rs:654-662](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L654-L662), [crates/globset/src/lib.rs:710-995](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L710-L995)

### Strategy Design Trade-Offs

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Partitioning globs into specialized strategy buckets (`Literal`, `Extension`, `Regex`, etc.) | Skips heavy regex execution for simple exact paths and extensions | Increases builder complexity and requires maintaining multiple collection types |
| Pooling `PatternSet` instances via `Arcool<...>>` in `RegexSetStrategy` | Amortizes allocation overhead across concurrent matching passes | Adds synchronization overhead and indirection via atomic reference counting |
| Amortizing candidate preparation (`Candidate` struct holding normalized path, basename, and extension) | Avoids repeatedly recalculating path components across multiple strategy lookups | Requires callers to construct or pass a `Candidate` or pay normalization cost per check |

Sources: [crates/globset/src/lib.rs:472-553](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L472-L553), [crates/globset/src/lib.rs:592-638](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L592-L638), [crates/globset/src/lib.rs:967-994](https://github.com/BurntSushi/ripgrep/blob/main/crates/globset/src/lib.rs#L967-L994)

## Regex Literal Optimization and Extraction

### Overview

Ripgrep achieves high-throughput line searches by extracting literal sequences from regular expression High-Level Intermediate Representations (`Hir`). By identifying required substrings, prefix patterns, or alternations, ripgrep can search lines using fast vectorized routines rather than invoking a slower regex engine across every byte. The `InnerLiterals` type encapsulates this process using heuristics implemented by the `Extractor` structure.

Sources: [crates/regex/src/literal.rs:11-42](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L11-L42)

### Call-Chain Execution Walkthrough

When initializing inner literal extraction for a regex, the engine traverses a specific validation and extraction sequence.

Sources: [crates/regex/src/literal.rs:54-92](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L54-L92)

1. `InnerLiterals::new(chir, re)`: Receives the configured HIR (`ConfiguredHIR`) and compiled regex (`Regex`). It checks whether literal extraction is permissible. If `chir.config().line_terminator` is `None`, or if `re.is_accelerated()` is true without Unicode word boundaries (`look_set().contains_word_unicode()`), or if `chir.hir().properties().is_alternation_literal()` is true, extraction is bypassed and `InnerLiterals::none()` is returned.
2. `Extractor::new().extract_untagged(hir)`: If heuristics permit extraction, instantiates an `Extractor` and processes the top-level HIR.
3. `Extractor::extract(hir)`: Matches on `hir.kind()` recursively (handling `Literal`, `Class`, `Repetition`, `Capture`, `Concat`, and `Alternation`), building up tagged literal sequences (`TSeq`).
4. `TSeq::cross` / `TSeq::union`: Combines child sequences via cross-products and unions while enforcing size limits (`limit_total`, `limit_literal_len`).
5. `seq.seq.optimize_for_prefix_by_preference()`: Optimizes the resulting sequence for prefix matching.
6. `TSeq::is_good()`: Validates whether the resulting literal sequence is beneficial for acceleration (rejecting poisonous literals or overly broad sets). If invalid, `seq.make_infinite()` marks the sequence as unusable.

Sources: [crates/regex/src/literal.rs:54-92](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L54-L92), [crates/regex/src/literal.rs:151-189](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L151-L189), [crates/regex/src/literal.rs:379-430](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L379-L430), [crates/regex/src/literal.rs:553-565](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L553-L565)

### Extractor Configuration Limits

The `Extractor` struct enforces strict bounds on literal extraction to prevent exponential explosions in sequence cardinality and memory usage.

Sources: [crates/regex/src/literal.rs:139-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L139-L147)

| Field Name | Default Value | Purpose |
| --- | --- | --- |
| `limit_class` | `10` | Maximum character or byte count allowed when converting a character class into a literal sequence before treating it as infinite. |
| `limit_repeat` | `10` | Maximum repetition count unrolled or processed during literal extraction for bounded quantifiers. |
| `limit_literal_len` | `100` | Maximum byte length permitted for any individual extracted literal string. |
| `limit_total` | `64` | Maximum total number of literals allowed in a single `Seq` collection during cross-products and unions. |

Sources: [crates/regex/src/literal.rs:139-147](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L139-L147), [crates/regex/src/literal.rs:283](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L283), [crates/regex/src/literal.rs:352-374](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L352-L374), [crates/regex/src/literal.rs:385](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L385), [crates/regex/src/literal.rs:434-436](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L434-L436)

> [!WARNING]
> If an alternation or union operation exceeds `limit_total` (64 literals), the extractor attempts to cull sequences by keeping only the first 4 bytes and deduplicating. If the limit is still breached, `seq2` is forced to an infinite sequence (`Seq::infinite()`), which infects the entire extraction tree and disables literal-based optimizations.

Sources: [crates/regex/src/literal.rs:395-430](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L395-L430)

### Literal Extraction Design Trade-Offs

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Bypassing extraction when `line_terminator` is `None` | Guarantees correctness when matching across arbitrary multiline boundaries where line-anchored prefilters are invalid | Skips acceleration opportunities on multiline (`-U`) searches |
| Poisonous literal detection (rejecting empty strings or high-frequency single bytes with rank $\ge 250$) | Prevents prefilters from triggering excessively on common filler characters like spaces or empty matches | May discard valid literals that could occasionally assist filtering |
| Culling long sequences to 4 bytes during union overflow | Retains finiteness instead of instantly collapsing into an infinite sequence on large alternations | Loses precision on longer distinguishing literal suffixes |

Sources: [crates/regex/src/literal.rs:55-63](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L55-L63), [crates/regex/src/literal.rs:398-430](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L398-L430), [crates/regex/src/literal.rs:633-639](https://github.com/BurntSushi/ripgrep/blob/main/crates/regex/src/literal.rs#L633-L639)

## Index Literal Set Analysis and Ngrams

### Overview

The `index` crate provides a prototype literal set and ngram query analysis module inspired by Google's `codesearch`. It extracts ngram structures from regular expression High-Level Intermediate Representations (`Hir`) to build a Boolean query of literal ngrams (`GramQuery`). This query guides fast index searching by decomposing complex expressions into required sub-byte or substring components.

Sources: [crates/index/src/literal.rs:1-8](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L1-L8), [crates/index/src/literal.rs:16-20](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L16-L20)

### GramQueryBuilder and Analysis Call Chain

The construction of ngram queries begins with the `GramQueryBuilder`, which parses an `Hir` expression into an `Analysis` struct and extracts the final query.

Sources: [crates/index/src/literal.rs:636-646](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L636-L646), [crates/index/src/literal.rs:667-675](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L667-L675)

The execution steps progress as follows:
1. `GramQueryBuilder::new()` initializes builder defaults with an `ngram_size` of `3`, a `limit_len` of `250`, and a `limit_class` of `10`.
2. `GramQueryBuilder::build()` invokes `build_analysis` and extracts the `.query` field from the resulting `Analysis`.
3. `GramQueryBuilder::build_analysis()` calls `self.b(exp)` to recursively process the `Hir`, then calls `.finalize()` on the analysis.
4. `GramQueryBuilder::b()` dispatches on `HirKind` variants (such as `Literal`, `Class`, `Alternation`, and `Concat`), combining literals and handling character class limits.
5. `Analysis::finalize()` / `Analysis::simplify()` checks if exact literal sets meet minimum length requirements relative to the ngram size, transitioning them into prefix and suffix ngram queries via `save_exact()`.
6. `GramQuery::and_ngrams()` iterates over literal sets, generates sliding-window ngrams using `ngrams()`, and intersects them into the query structure.

Sources: [crates/index/src/literal.rs:256-272](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L256-L272), [crates/index/src/literal.rs:445-502](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L445-L502), [crates/index/src/literal.rs:644-748](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L644-L748), [crates/index/src/literal.rs:818-830](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L818-L830)

### GramQuery and LiteralSet Configuration Constants

| Field / Parameter | Default Value | Purpose |
| --- | --- | --- |
| `ngram_size` | `3` | Size of sliding ngrams measured in bytes extracted from literal strings |
| `limit_len` | `250` | Maximum length threshold for concatenation analysis before falling back to anything |
| `limit_class` | `10` | Maximum character or byte range count allowed when expanding character classes |

Sources: [crates/index/src/literal.rs:643-646](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L643-L646)

> [!WARNING]
> If a Unicode or byte character class exceeds `limit_class` (10 elements), `class_over_limit_unicode` or `class_over_limit_bytes` returns true, causing `GramQueryBuilder::b()` to immediately abort exact extraction and return `Analysis::anything()`, effectively disabling index acceleration for broad character classes.

Sources: [crates/index/src/literal.rs:686-690](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L686-L690), [crates/index/src/literal.rs:704-706](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L704-L706), [crates/index/src/literal.rs:766-786](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L766-L786)

### Index Analysis Design Trade-Offs

| Design Choice | Benefit | Cost |
| --- | --- | --- |
| Byte-based ngram sliding window | Simple implementation allowing rapid extraction without complex unicode grapheme segmentation | Can produce noisy ngrams on multibyte UTF-8 boundaries |
| Automatic canonicalization (`sort()` and `dedup()`) on `LiteralSet` | Ensures consistent, duplicate-free sets for fast set operations and factoring | Adds sorting overhead during set creation and modification |
| Factorization of disjunctions in `GramQuery::or` / `and` | Compresses common sub-expressions to minimize query complexity | Requires linear merge scans over sorted literal vectors |

Sources: [crates/index/src/literal.rs:551-589](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L551-L589), [crates/index/src/literal.rs:649-652](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L649-L652), [crates/index/src/literal.rs:822-830](https://github.com/BurntSushi/ripgrep/blob/main/crates/index/src/literal.rs#L822-L830)

## Engine Flag Configuration and Limits

### Overview

Configuring regex parser execution options, engine selection flags, and safety limits in ripgrep is handled through individual implementations of the `Flag` trait mapped to logical configurations in `LowArgs`. These flags govern engine choices, fallback behaviors, and limits such as DFA and regex size thresholds.

Sources: [crates/core/flags/defs.rs:1-18](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L1-L18), [crates/core/flags/defs.rs:367-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L376)

### Flag and Engine Configuration Reference

| Flag Implementation | Long Name | Short Name | Negated Name | Purpose |
| --- | --- | --- | --- | --- |
| `AutoHybridRegex` | `auto-hybrid-regex` | `None` | `no-auto-hybrid-regex` | (DEPRECATED) Dynamically choose between engines if appropriate |
| `DfaSizeLimit` | `dfa-size-limit` | `None` | `None` | Set the DFA size limit |
| `Engine` | `engine` | `None` | `None` | Select the regex engine implementation |
| `RegexSizeLimit` | `regex-size-limit` | `None` | `None` | Set the compiled regex size limit |

Sources: [crates/core/flags/defs.rs:64-66](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L64-L66), [crates/core/flags/defs.rs:129](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L129), [crates/core/flags/defs.rs:321-330](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L321-L330)

### Flag Update Execution Flow

When flags are parsed, their corresponding `Flag::update` method mutates the underlying `LowArgs` structure. For example, `AutoHybridRegex::update` interprets the boolean switch value and assigns an `EngineChoice` variant:

Sources: [crates/core/flags/defs.rs:367-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L376)

```
parse_low_raw() → Flag::update(v, args) → AutoHybridRegex::update() → args.engine = EngineChoice::Auto
```

Sources: [crates/core/flags/defs.rs:367-376](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L367-L376)

> [!NOTE]
> If both `--auto-hybrid-regex` and explicit engine flags like `--engine=default` or `-P` are passed sequentially, the final engine mode is determined by the last flag processed in the argument vector due to sequential assignment in `update`.

Sources: [crates/core/flags/defs.rs:397-414](https://github.com/BurntSushi/ripgrep/blob/main/crates/core/flags/defs.rs#L397-L414)

## Related

- [[Rust Regex Matching]]

