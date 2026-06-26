# RLHF Studio

## Product Summary

RLHF Studio is a configurable RLHF training-data collection prototype. Admins configure annotation workflows, annotators complete feedback tasks, and the system exports structured preference data as JSONL or CSV.

This product is for training-data creation only. It does not train models, fine-tune models, manage reward models, or run training pipelines.

v1 also includes seeded prompt packs, prompt metadata, coverage previews, batch readiness checks, and a lightweight quality review simulation with agreement scoring, a review queue, and reviewer adjudication saved in localStorage.

## Live Demo

Live URL: https://rlhf-studio-nu.vercel.app/

## What the Prototype Demonstrates

- Dashboard for RLHF data-collection projects
- Task configuration screen
- Methodology presets
- Seeded prompt packs for helpfulness, safety, accuracy, and mixed evaluation
- Prompt metadata and batch coverage preview
- Prompt batch readiness checks
- Dynamic annotator preview generated from configuration
- Live annotation task
- Required-field validation
- localStorage persistence
- Results table and detail view
- Quality review queue with agreement scoring
- Reviewer adjudication modal saved to localStorage
- Export lineage fields for prompt source, seed pack, domain, difficulty, intent category, and risk category
- JSONL export
- CSV export

## Demo Walkthrough

1. Open dashboard.
2. Create or configure a helpfulness project.
3. Select Meta-style helpfulness comparison.
4. Review the selected seeded prompt pack, coverage summary, and batch checks.
5. Preview generated annotator UI.
6. Submit annotations across the selected task batch.
7. Open results and review agreement scores.
8. Adjudicate a low-confidence or disagreed task.
9. Export all records or approved / accepted records only.
10. Switch to safety preset to show that the annotator UI, prompt pack, and output schema change based on configuration.

## How to Run Locally

```bash
npm install
npm run dev
npm run build
```

Open the local Vite URL shown in the terminal after `npm run dev`.

## Product Spec

Full product specification is available in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

## Implemented Scope

- Configuration-driven pairwise annotation
- Helpfulness and safety presets
- Seeded prompt packs and selectable task batches
- Prompt metadata and coverage preview
- Prompt batch readiness checks
- Dynamic preview
- Annotation submission
- Results review with lightweight quality scoring
- Reviewer adjudication simulation
- Export lineage fields
- JSONL/CSV export
- localStorage persistence

## Out of Scope

- Model training
- Reward model training
- Fine-tuning
- Live model generation
- Uploaded prompt sources in v1
- Authentication
- Enterprise roles
- Backend database in v1

## Roadmap

- P1: data quality — gold tasks, stronger reviewer workflows, annotator analytics
- P2: operational scale — uploaded JSONL/CSV prompt sources, annotator-created prompts, task queues, assignment
- P3: enterprise readiness — backend, RBAC, audit logs, integrations, live response source integrations

## Build Notes

The workspace starts with no saved projects. The prototype uses seeded prompt packs and responses for reliable local demos, while localStorage keeps user-created projects, annotations, and per-project task progress across refreshes.
