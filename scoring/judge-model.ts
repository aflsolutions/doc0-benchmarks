// Ported from doc0 (commit 175c6b0e) — canonical scoring copy for published benchmarks.
//
// Adapted for the public benchmarks repo: the internal `vertexChat` singleton
// (src/lib/ai-providers.ts) — which pins the `eu` multi-region endpoint for
// EU data-residency compliance — has no place in this leaf-only repo. This
// port constructs its own Vertex client on demand, selected by credential
// PRESENCE rather than the internal `WIKI_EVAL_JUDGE_PROVIDER` flag: when all
// three GOOGLE_VERTEX_* env vars are set, judge calls route through Vertex;
// otherwise they fall back to Google AI Studio via GOOGLE_GENERATIVE_AI_API_KEY.
// The two branches keep the exact model ids the source pins per backend
// (gemini-2.5-flash / gemini-3.5-flash) — methodology parity, not a live
// re-tune. Published runs MUST document which backend + model + seed a given
// result was produced with, since AI-Studio- and Vertex-judged scores are not
// directly comparable (see judge-comparative.ts / judge-accuracy.ts callers).

import { google } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
import type { LanguageModel } from "ai";

/**
 * Judge model provider. Default: Google AI Studio (`gemini-2.5-flash`) via
 * GOOGLE_GENERATIVE_AI_API_KEY. When GOOGLE_VERTEX_PROJECT,
 * GOOGLE_VERTEX_CLIENT_EMAIL, and GOOGLE_VERTEX_PRIVATE_KEY are ALL set, a
 * Vertex client is constructed on the `global` location instead and used
 * with `gemini-3.5-flash` — the model id the source pins for Vertex mode
 * (Vertex's `eu` endpoint 404s on 2.5-flash; `global` is used here since this
 * repo has no EU-residency requirement of its own).
 */
export function judgeModel(): LanguageModel {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const clientEmail = process.env.GOOGLE_VERTEX_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_VERTEX_PRIVATE_KEY;

  if (project && clientEmail && privateKey) {
    const vertex = createVertex({
      project,
      location: "global",
      googleAuthOptions: {
        credentials: {
          client_email: clientEmail,
          // Env stores the PEM key with literal "\n" — restore real newlines.
          private_key: privateKey.replace(/\\n/g, "\n"),
        },
      },
    });
    return vertex("gemini-3.5-flash");
  }

  return google("gemini-2.5-flash");
}
