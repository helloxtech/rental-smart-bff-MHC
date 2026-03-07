# Rental Smart MHC Data Model Review

Date: March 7, 2026

## Scope Reviewed

- [schema.sql](/tmp/rental-smart-bff-MHC-deploy/supabase/schema.sql)
- [worker.ts](/tmp/rental-smart-bff-MHC-deploy/src/worker.ts)
- [types.ts](/tmp/rental-smart-portal-MHC-git/src/types.ts)

## Summary

The current model is strong enough for the portal that exists today: multi-community operations, lots, homes, residents, leases, receivables, payments, maintenance, violations, announcements, utility metering, documents, and a lightweight audit trail are all represented and seeded. The visible PM workflows in the current portal can be tested end to end with live Supabase data.

The main gaps are not around today’s screens. They are around future-proofing the lifecycle edges: applications/screening, multi-charge payment allocation, notice/move-out workflow, inspection history, event timelines, richer document governance, and automatic audit capture.

## Gaps Found

### 1. Applicant workflow is underspecified

Current state:
- `residents.status = 'Applicant'` exists.

Gap:
- There is no dedicated application entity for prospect intake, approval/denial, screening results, income verification, deposits paid before move-in, or document checklist tracking.

Impact:
- Prospect to approval is not auditable.
- Application fees and screening decisions cannot be modeled cleanly.

Recommended schema:
- `resident_applications`
- Optional follow-on: `application_screenings`

### 2. Payment accounting is too narrow for real-world allocations

Current state:
- `payments` has a single `charge_id`.

Gap:
- One payment can only target one charge.
- Real PM workflows often apply one payment across multiple charges, or partially allocate it across rent, utilities, and fees.

Impact:
- Partial payments and multi-line resident ledgers are not modeled correctly.
- Collections reporting and write-off logic will become brittle.

Recommended schema:
- `payment_allocations(payment_id, charge_id, allocated_amount, allocation_order, created_at)`

### 3. Notice and move-out workflow is missing

Current state:
- Leases can terminate or expire.
- Residents can become `Past` or `Eviction`.

Gap:
- There is no formal notice entity for renewal notices, non-renewals, cure-or-quit, eviction prep, or resident intent-to-vacate.

Impact:
- Notice tracking is procedural, not system-backed.
- PMs cannot prove notice dates or manage turnover in a structured way.

Recommended schema:
- `resident_notices`

### 4. Home/lot inspections and turn workflow are missing

Current state:
- Homes have condition fields.
- Lots have statuses like `Under Setup`, `Renovation`, and `Out of Service`.

Gap:
- No inspection table exists for move-in, move-out, annual, rehab, or safety inspections.
- No make-ready event history exists.

Impact:
- Home lifecycle from occupied to rehab to re-list is not auditable.
- Photo-backed inspection reporting is not structured.

Recommended schema:
- `inspections`
- Optional follow-on: `turn_tasks`

### 5. Maintenance and violation timelines are flattened

Current state:
- `maintenance_requests` and `violations` contain current status and some summary fields.

Gap:
- There is no event history table for reassignment, status changes, notes, communications, or escalations.

Impact:
- Managers lose the timeline once the current row is updated.
- Vendor accountability and compliance history are weak.

Recommended schema:
- `maintenance_events`
- `violation_events`

### 6. Document governance is too light

Current state:
- `documents` stores file metadata and entity linkage.

Gap:
- No category, version, effective date, expiry date, visibility, or “current version” flag.

Impact:
- Lease packets, rules, inspection photos, and notices cannot be governed cleanly.

Recommended schema change:
- Extend `documents` with category/version/visibility fields.

### 7. Audit logging exists but is not automatic

Current state:
- `audit_log` exists.
- Seed data writes a couple of audit rows.

Gap:
- The BFF does not automatically write audit events for CRUD operations.

Impact:
- The table is present, but it does not currently satisfy a real audit requirement.

Recommended implementation:
- Add audit writes inside BFF mutation handlers or use database triggers for sensitive entities.

## Missing BFF Endpoints

These are the biggest API gaps relative to a full MHC operating model:

- `GET /api/communities/:id/profiles`
- `GET /api/communities/:id/documents`
- `POST /api/communities/:id/documents`
- `GET /api/communities/:id/applications`
- `POST /api/communities/:id/applications`
- `PATCH /api/applications/:id`
- `GET /api/communities/:id/notices`
- `POST /api/communities/:id/notices`
- `GET /api/communities/:id/inspections`
- `POST /api/communities/:id/inspections`
- `GET /api/maintenance/:id/events`
- `POST /api/maintenance/:id/events`
- `GET /api/violations/:id/events`
- `POST /api/violations/:id/events`
- `POST /api/payments/:id/apply`

## Recommendation Priority

### High priority

- Add `payment_allocations`
- Add `resident_notices`
- Add `inspections`
- Add automatic audit writes in the BFF

### Medium priority

- Add `resident_applications`
- Add `maintenance_events`
- Add `violation_events`
- Extend `documents`

### Low priority

- Add deeper screening/checklist tables after auth and resident portal work are complete

## Conclusion

For the current portal, the model is sufficient and testable with live data.

For the next stage of the product, the most important structural gap is ledgering and lifecycle history, not basic CRUD coverage. If the goal is a production-grade PM system rather than a demoable operations portal, the next schema wave should focus on payment allocations, notices, inspections, event timelines, and automatic audit capture.
