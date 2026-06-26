# RLHF Studio

## Product Summary

RLHF Studio is a configurable RLHF training-data collection prototype. Admins configure annotation workflows, annotators complete feedback tasks, and the system exports structured preference data as JSONL or CSV.

This product is for training-data creation only. It does not train models, fine-tune models, manage reward models, or run training pipelines.

v1 also includes a lightweight quality review simulation with agreement scoring, a review queue, and reviewer adjudication saved in localStorage.

## Live Demo

Live URL: https://rlhf-studio-nu.vercel.app/

## What the Prototype Demonstrates

- Dashboard for RLHF data-collection projects
- Task configuration screen
- Methodology presets
- Dynamic annotator preview generated from configuration
- Live annotation task
- Required-field validation
- localStorage persistence
- Results table and detail view
- Quality review queue with agreement scoring
- Reviewer adjudication modal saved to localStorage
- JSONL export
- CSV export

## Demo Walkthrough

1. Open dashboard.
2. Create or configure a helpfulness project.
3. Select Meta-style helpfulness comparison.
4. Preview generated annotator UI.
5. Submit an annotation.
6. Open results and review agreement scores.
7. Adjudicate a low-confidence or disagreed task.
8. Export all records or approved / accepted records only.
9. Switch to safety preset to show that the annotator UI and output schema change based on configuration.

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
- Dynamic preview
- Annotation submission
- Results review with lightweight quality scoring
- Reviewer adjudication simulation
- JSONL/CSV export
- localStorage persistence

## Out of Scope

- Model training
- Reward model training
- Fine-tuning
- Live model generation
- Authentication
- Enterprise roles
- Backend database in v1

## Roadmap

- P1: data quality — gold tasks, stronger reviewer workflows, annotator analytics
- P2: operational scale — batches, task queues, assignment
- P3: enterprise readiness — backend, RBAC, audit logs, integrations

## Build Notes

The workspace starts with no saved projects. The prototype still uses seeded prompts and responses inside configurable tasks, while localStorage keeps user-created projects and annotations across refreshes.
