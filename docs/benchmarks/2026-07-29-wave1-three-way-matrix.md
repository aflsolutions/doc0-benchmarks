# Wave-1: ten never-tuned repositories, three systems, one judge

**2026-07-29** · doc0 @ `f0638375` · judge: Vertex `gemini-3.5-flash`, seed 42, full population · ~20,000 claim groups · 0 judge failures

Every number below was produced by the same instrument: extract every claim-citation group from every page of a generated wiki, resolve each citation against a clone of the repository, and ask a pinned LLM judge whether the cited code supports the claim. No sampling (the full claim population is judged), no per-system prompt tuning, no cherry-picked pages. The corpora and per-arm methodology notes are committed in this repo; peer pages are pinned by sha256 manifest (`corpora/peers/`), never redistributed.

## Why these repositories

The ten repos were chosen for language and size spread — Java, Kotlin, Rust, Ruby, PHP, C#, Swift, Go — and, critically, **none of them were used to develop or tune doc0's generation pipeline**. Three of the ten (argo-cd, fd, FluentValidation) were additionally operated as a *sealed holdout*: selected in advance, generated and judged last, with a hard rule that no pipeline change ships between the first capture and the last. hono, the one repo doc0 *was* tuned on, is included as a labeled reference point — for every system, tuned-repo numbers and never-tuned numbers should be read separately.

## Results — claim support (full population)

| Repository | Lang | doc0 | DeepWiki | CodeWiki (Google) |
|---|---|---|---|---|
| resilience4j | Java | **0.827** | 0.726 | 0.419 |
| ktor | Kotlin | **0.796** | 0.613 | 0.512 |
| ripgrep | Rust | **0.842** | 0.530 | not covered |
| sidekiq | Ruby | **0.864** | 0.378 | not covered |
| laravel/framework | PHP | **0.824** | 0.618 | 0.326 |
| Polly | C# | **0.885** | 0.583 | 0.413 |
| Alamofire | Swift | **0.862** | 0.433 | 0.591 |
| argo-cd † | Go | **0.871** | 0.629 | 0.382 |
| fd † | Rust | **0.904** | 0.590 | 0.453 |
| FluentValidation † | C# | **0.884** | 0.776 | 0.346 |
| *hono (doc0-tuned)* | TS | *0.912* | *0.834* | *0.441* |
| **Mean (never-tuned, 10)** | | **0.856** | **0.588** | **0.430** |

† sealed holdout. "Not covered": CodeWiki returns 404 for these repos (its coverage is curated, not on-demand).

Citation resolution (share of citations that point at a real file and line range in the judged clone):

| | doc0 | DeepWiki | CodeWiki |
|---|---|---|---|
| Range | 0.911 – 1.000 | 0.865 – 0.997 | 0.759 – 1.000 |

doc0 wins every per-repo head-to-head — 10/10 against DeepWiki, 8/8 comparable against CodeWiki — and doc0's worst never-tuned repo (0.796) outscores both peers' best never-tuned repo (0.776 and 0.591 respectively).

Two second-order observations matter as much as the mean:

- **Consistency.** doc0's never-tuned spread is 0.796–0.904. DeepWiki's is 0.378–0.776, and its 0.834 on hono — the number most often quoted — turns out to be its best case, not its typical case. A system you'd rely on for arbitrary repos needs a floor, not a showcase.
- **The sealed holdout scored *above* the main wave** (doc0 mean 0.886 vs 0.843). Whatever quality the pipeline has, it is not an artifact of tuning to the measured set.

## Fairness protocol

Comparing your own system to competitors with your own instrument invites two failure modes: measuring peers badly, and measuring them on the wrong code. Both were addressed explicitly.

**CodeWiki was judged against its own pinned commits.** Every CodeWiki page displays the commit it was generated from; each arm was judged against a clone at exactly that SHA (recorded in the manifests). For four repos the CodeWiki pin and the doc0 clone are the *same commit*, making those rows commit-identical comparisons. DeepWiki publishes no generation commit; its arms were judged against clones from the same capture window — and since its citation resolution stayed at 0.87–1.00, staleness cannot explain its claim-support scores (drifted pages break citations before they break claims).

**Extraction artifacts were hunted before numbers were accepted.** CodeWiki's citation style embeds the file path in the GitHub URL with a bare symbol name as the link label — a dialect the claim extractor does not read natively. Three runs were required before the CodeWiki-hono number was accepted:

1. A naive citation rewrite scored 0.480 — but it had replaced linked symbol names with file paths, so link-stripping deleted the grammatical subject of many claims. Rejected as unjudgeable input.
2. A prose-preserving normalization (symbol name stays in text, machine-readable citation appended; `corpora/peers/fetch-codewiki/normalize.ts`) scored 0.441.
3. A sensitivity variant widening every citation's evidence window by ±15 lines (testing whether CodeWiki's single-line symbol anchors were simply too narrow to evidence anything) scored 0.459.

The number is stable across both artifact hypotheses. What the audit sample actually shows is citations that resolve to real lines that do not evidence the claim — a `package.json` formatting-script line cited as evidence for an exports-validation behavior, and similar. Precise-looking, wrong-target citations are the dominant CodeWiki failure mode: resolution 0.76–1.00, support 0.33–0.59.

**What this metric rewards.** Claim support measures whether a wiki's *cited evidence backs its prose*. A system can write true things with bad citations and score poorly here; the metric deliberately treats "true but unevidenced" as a documentation defect, because a reader cannot distinguish an uncited truth from an uncited hallucination. All three systems are held to that same standard, and doc0's generation pipeline was built for it — that is a genuine methodological advantage doc0 chose to invest in, not an instrument bias.

## Honesty section

- **doc0's ktor row carries a known self-defect.** ktor's page plan was polluted by OpenAPI *test fixtures* (a Swagger Petstore sample in `test-resources/` spawned ~50 per-endpoint stub pages; 90 of 137 pages are thin). It was judged as generated — 0.796 is the honest number for the defective wiki — and the fix (scoping OpenAPI discovery away from test paths) ships after this wave so the holdout stays meaningful.
- **Claim populations differ by an order of magnitude across systems** (doc0 775–1,941 groups per repo; DeepWiki 251–1,359; CodeWiki 53–315). CodeWiki writes one deep page per repo; its wikis simply assert less. Means are per-arm rates, not weighted by volume.
- **doc0's citation-resolution weak spot is JVM repos** (0.911–0.924 on ktor/resilience4j vs 0.98–1.00 elsewhere) — under audit as a suspected symbol-path resolution issue in deep package hierarchies.
- Judged with a single pinned judge model. A different judge would shift absolute numbers; the protocol (full population, same judge, both sides) is designed so *relative* comparisons survive that shift.

## Reproduce

Corpora for all ten repos are committed (`corpora/<repo>-2026-07/`, `_meta.json` records doc0 commit, source SHA, and models: small `gemini-3.5-flash-lite`, big `gemini-3.6-flash`). Peer pages re-fetch and hash-verify via `pnpm peers:fetch` (DeepWiki/zread) and `corpora/peers/fetch-codewiki/` (CodeWiki; requires playwright, see its README). Judged runs go through the standard runner with `--judged --samples 2000` (full population; the slice caps at the population size). Deterministic metrics need no API key.
