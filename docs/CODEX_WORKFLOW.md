# Last Stand development workflow

Use the single Last Stand Master project with this repository as its game root.
Codex leads development and recommends the next logical improvement. Robert owns
the game, tests playable changes, and decides whether to advance. The project is
an organizing context, not an automatic agent router.

## Conversations

Start a fresh conversation for each new approved, bounded milestone or task.
Keep the current conversation through development, testing, debugging and
Robert's acceptance; fix bugs found during acceptance there. Use one of these
categories in the title:

1. Main gameplay development — mechanics, balance and progression.
2. Small bugs and UI — focused fixes.
3. Architecture — major technical proposals and approved changes.
4. Testing, documentation and maintenance — validation and release preparation.

At handoff, Codex recommends a conversation title/category, model and reasoning
level with a brief reason, a ready-to-copy starting prompt, and whether the new
task should begin with a proposal or implementation. Prefer lower-usage models
for straightforward tasks, Sol at Medium for ordinary complex development, and
High reasoning only when needed. Robert starts the conversation and selects its
model/reasoning level; Codex changes neither automatically. The repository does
not pin a model. Use the existing ChatGPT sign-in and included allowance; do not
use API keys, paid credits or a separate orchestration service.

## Resume and deliver

At the start of a new task, read AGENTS.md and the current-status section at the
top of RELEASE_PLAN.md. Read only the relevant source and documentation after
that; do not repeat a whole-project audit or a specialist smoke check by default.
Confirm the current branch and uncommitted changes before editing. Do not switch
branches or disturb unrelated work.

Work on one approved, bounded milestone. Use focused checks while developing,
then the checks required by AGENTS.md and CI before source integration. Report
what changed, tests that actually passed, what remains untested, and a short phone
checklist for playable work. Keep source merge and public publication separate.
After Robert approves the playtest, finish the development status updates and
any required source integration. Announce that the milestone is complete, then
recommend a fresh conversation and the next milestone using the handoff above.
Do not start that milestone, a conversation or subagents without Robert's approval.

## Optional subagents

Subagents are off by default in .codex/config.toml through both
`features.multi_agent=false` and `agents.enabled=false`. Keep the four existing
.codex/agents/*.toml files as optional references. Their presence does not prove
that a particular model ran or that the current client loaded them.

Use a subagent only after Robert explicitly authorizes a specific task and its
scope. For a one-session CLI opt-in, launch a new session with
`codex --cd <repository> -c features.multi_agent=true -c agents.enabled=true`;
verify the effective setting and available tools before delegation. In the desktop
app, a temporary project configuration change and a new chat may be needed;
restore both settings to false when that approved task ends. Never infer approval
from a task category or specialist
file. If the client cannot verify the requested role/model, report the limit
instead of silently substituting it.

## Where durable information lives

- RELEASE_PLAN.md: concise current status at the top, historical milestones below.
- DEVELOPMENT.md and docs/VALIDATION.md: setup, test commands and evidence limits.
- docs/DEPLOYMENT.md and deployment/pages-release.json: guarded publication.
- docs/PHONE_ACCEPTANCE.md: accepted device observations.

Do not create a new roadmap file for each chat.
