# Owner phone acceptance — Alpha 0.86

On 2026-10-29, after receiving the restructuring phone checklist, Robert reported:

> i tested and everything seems to work great lets keep going

Device/browser context: Samsung S21 Ultra / Brave, as previously identified by
the owner. This records owner-reported acceptance of the unchanged Alpha 0.86
game, PWA build 7cf8f34890269ad6. The accepted playable payload is byte-identical
to the production output verified on source d8ee87bad0fad5b639573777cec9a3f2480a64a8.
Later acceptance-documentation edits do not change the payload.

No issues were reported. The phone acceptance gate for this preservation task
is satisfied. The report is a functional test result, not an instrumented frame
rate, thermal, memory or storage-durability measurement. It does not establish
APK behavior or guarantee every possible gameplay path was exercised.

This is not permission for an automatic main merge, a live replacement, a custom
domain change, credential creation or an engine/gameplay redesign. Main-targeted
integration review and CI remain required. Existing repository instructions say
not to merge automatically. The Pages publishing identity/default-branch setup
remains separate; no deployment was made to obtain this acceptance.

MANUAL_TEST.md remains the reusable checklist for future playable deliveries;
its template checkboxes are not instrumented evidence. Preserve the immutable
legacy provenance, which accurately records what was known before this report.
