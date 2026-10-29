# Alpha 0.86 — Health Awareness

Target: S21 Ultra / Brave, portrait and landscape. Robert reported 0.85 worked great and authorized the next part. This small combat-clarity batch uses the existing health fields; no damage, healing, armor, enemy, odds, protection or save rule changes.

## What changed

- After an accepted hit, the health area briefly shows actual HP lost after armor, such as −9 HP. It lasts 0.7 active seconds. Ignored hits and safe training cannot create a false loss cue.
- At the existing 25%-of-maximum threshold, LOW HP adds a text warning in both composed and Classic HUDs. It clears when health rises above that ratio. A fresh hit temporarily takes priority.
- When the existing Second Wind perk triggers, SECOND WIND appears for its existing two-second protection window. A later Dash cannot falsely retrigger that label. All new cue time freezes with Pause/choices/backgrounding. Reduced Effects keeps these static cues; no new flash, animation or sound is added.

## Update

Keep a JSON backup. Open https://crazy5150760.github.io/last-stand-after-dark/install/ and Check for Updates. A downloaded 0.86 is not active yet. Finish the run, close all game/setup windows and reopen the icon. If Brave keeps 0.85, use Settings → Apps → Brave → Force stop, then reopen; leave storage/data untouched. Confirm ALPHA 0.86 on the main menu and Active offline copy: Alpha 0.86 in setup.

## Phone checklist

- [ ] Play an ordinary run and take a hit when convenient. The existing health area briefly reports HP lost; health numbers stay visible. Check portrait/landscape and report any cramped text. Hits blocked by Dash should not show a new HP-loss cue.
- [ ] If health reaches a quarter or less, LOW HP appears after the brief loss cue. Healing above a quarter clears it. Readability should improve without a distracting flash or sound. Do not risk a valuable run solely to force this check.
- [ ] Pause soon after a hit; inspect Settings and return. The cue should remain frozen until Resume. Try Reduced Effects and the Classic/composed HUD comparison: both retain clear health information. Joystick + second-finger Pause, background/return and normal results/retry still work.
- [ ] If Second Wind is offered and triggers, its label accompanies the existing recovery/protection, then settles to LOW HP if still critical. Skip this optional phone case if the perk does not appear; its timing and non-retriggering are tested automatically. New runs start without old hit or recovery cues; HP-safe training keeps HP SAFE.
- [ ] Check records/settings, then finish/close, enable airplane mode, reopen and play briefly. Reconnect afterward.

Are the new cues noticeable without getting in the way? Damage and difficulty should feel identical to 0.85; report any difference. No new quantitative performance claim follows from a functional pass.

## Verification

187 focused game checks and 32 offline cases pass locally, including 14 new health-cue checks. Both builders pass. An AST comparison removes only the new bounded cue/helper, three cue/reset assignments, two health-text expressions, three style writes and one local presentation reference; every other main AST node matches 0.85 after six label substitutions. Native damage math, armor, Second Wind trigger/recovery/invulnerability, counters, RNG, effects, choices, callbacks, saves and progression are unchanged. The HTML shell, CSS and embedded media are exact. A packaging refinement removes redundant punctuation whitespace, guarded by the builder’s full-AST equivalence check; readable game logic and all literals remain unchanged. No new asset, DOM element, saved option, timer or rendering loop is added.

Full GitHub CI and packaging run before publication; final counts and deployment provenance accompany the artifacts. Device text layout, touch/lifecycle behavior and natural-play balance require the owner checklist. The cue is one overwritten transient object and is cleared on every native start, including training/performance/previews.
