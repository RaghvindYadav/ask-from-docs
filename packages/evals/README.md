# Evals

`questions.json` is the fixed test set. Target: 50 questions, written in week 2 **before** any retrieval improvements, so the baseline is honest.

| Type | Count |
| --- | --- |
| simple | 15 |
| exact_api | 10 |
| version_specific | 10 |
| vague (copy real GitHub issue / Stack Overflow titles) | 8 |
| out_of_scope (should abstain) | 7 |

For each question, find the docs page that answers it, paste its URL into `expected_url`, and write a 1–2 sentence `expected_answer`.

The runner (`npm run eval`, week 2) reports Recall@5, answer correctness (LLM judge), abstain accuracy, cost and p50 latency.
