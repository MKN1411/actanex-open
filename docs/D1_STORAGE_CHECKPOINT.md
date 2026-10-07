# D1 File Storage - Work Checkpoint

Status: resumed; implementation and local verification complete, publication pending.
Date: 2026-10-07. Workspace: ActaNex-Open. Branch: CF-instance-update.
Published production remains 3.2.4 until the pending 3.3.0 workflow succeeds.
Current work includes shared installer, D1/R2 selection, streamed SQL backups up to
64 MiB, split hosted backup transport under a verified instance lock, and 50 passing
tests plus 24 passing desktop/mobile UI tests. Check current Git and workflow state
before doing any work. Remaining: commit/reproducibility checks, PR publication,
original Open live smoke verification, final status, and disable heartbeat on completion.
Do not deploy mkn-open. Only the original actanex-open is authorized for publication.

## Implemented Locally

- Central documentStorage service with R2 and D1 adapters.
- D1 BLOB chunks of 512 KiB, maximum individual file 8 MiB, atomic batch insert,
  metadata, SHA-256 checks, backend-specific d1/UUID keys.
- Existing unprefixed R2 keys remain readable, including DOCUMENTS_BUCKET fallback.
- All found application file reads/writes moved to the service: vouchers, expenses,
  signed approvals, AI reading and Lexware attachments. No upload succeeds without storage.
- New stored_documents/stored_document_parts bootstrap tables included by release schema scanner.
- D1-only discovery, preflight, backups and rollback no longer require an R2 binding.
  FILE_STORAGE_MODE binding must agree with the requested mode; updates preserve it.
- Update handoff copies detected mode; hides an absent R2 resource.
- Hosted installer partially adjusted for body.fileStorageMode and conditional R2 creation/binding.
  No visible installer selection yet. Default remains R2 until the full workflow is ready.

## Verification

- npm test: 42 passing, including real workerd/D1 binary roundtrip and corruption checks,
  legacy R2 reads, missing-storage rejection, D1-only discovery/update/backup/code rollback.
- Worker typecheck passes after the latest hosted installer edit.
- npm run test:ui: 20 desktop/mobile tests passed before latest hosted installer edit.
- No tests or foreground command sessions are running.

## Historical Remaining Work (Now Implemented)

1. Complete hosted installer collision checks without R2 API calls in D1 mode; returned
   resource summary must reflect D1. Check R2 activation failure before mutating resources.
2. Add explicit D1/R2 choice and accurate requirements, token permissions, summaries and
   resource visibility in BOTH installer/index.html and src/Web/installer.html. Preserve
   old R2 installations. Include fileStorageMode in payloads and collision-check requests.
3. Update local installer/server.js and generated PowerShell/Bash installation scripts.
   Inspect its Worker deployment path: local installer currently chiefly creates resources
   and sets secrets. Do not advertise successful deployment without verified bindings.
4. Current backup SQL/Worker limit remains 16 MiB. D1 documents expand in SQL exports,
   so design bounded/streamed larger-backup capture and restoration instead of simply
   increasing in-memory buffers. All incomplete snapshots remain fail-closed. Check Workers
   128 MiB memory and Free request/query budget, plus backup vault quota. No automatic R2
   fallback or destructive migration. Document practical D1 file/aggregate limits accurately.
5. Add D1 binary SQL export/full restoration tests, new installer/D1 UI tests, oversize,
   missing-part, transactional failure and existing R2 regression tests.
6. Review status/error strings still claiming R2 storage, r2Key compatibility in frontend,
   customMetadata parity if needed, and misleading GoBD guarantees. Avoid unrelated refactors.
7. Rebuild a NEW release/version, run typecheck/unit/UI/reproducibility checks and visual QA.
   Publish through main/PR workflow ONLY when end-to-end ready. Attach every created PR.
   Smoke-test original Open, including real backup/download. Never restore live user data.

## Usage and Resume

The user explicitly requested continuous usage checks and pausing at 1 percent remaining,
then automatic continuation when more than 1 percent remains. Last reported short-window
usage: 99 percent; weekly usage: 15 percent. Do not consume a reset credit without permission.
Use get_usage_limits at work milestones; minimum remaining available window controls pause.
Keep a checkpoint and stop implementation if any relevant window has <=1 percent left.
When resuming, read current git status and this file, verify no other work has changed these
files, then continue required work. Do not claim this unfinished feature is live.
