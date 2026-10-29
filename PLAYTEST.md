# Alpha 0.85 — Clear Upgrade Choices

Target: S21 Ultra / Brave, portrait and landscape. Robert confirmed the 0.84 update worked and authorized the next part. This is a three-part choice-screen presentation batch, not new weapons, altered odds or combat tuning.

## What changed

- Weapon cards separate their name from current → next rank. Evolution cards show rank 3/3 → evolved.
- Stackable support cards show the immediate current → next stat. Field Medic shows both maximum HP and actual capped healing. Dash uses the survivor's current recharge and two decimal places; Rapid Fire respects the existing interval floor. One-time abilities keep their native descriptions. Rapid Fire copy now describes its existing interval reduction accurately.
- Current build and evolution guidance move into YOUR BUILD & EVOLUTIONS below the cards, initially collapsed for each offer. Choices stay prominent; every retained reroll/banish control remains below the reference.

## Update

Keep a real JSON backup. Open https://crazy5150760.github.io/last-stand-after-dark/install/ and Check for Updates. A downloaded 0.85 is not active yet. Finish the current run, close all Last Stand game/setup windows and reopen the icon. If Brave retains 0.84, use Android Settings → Apps → Brave → Force stop, then reopen; leave storage/data untouched. Confirm ALPHA 0.85 at the game main menu and Active offline copy: Alpha 0.85 in setup. The 0.84 active/downloaded labels and restart help remain available while waiting.

## Phone checklist

- [ ] Reach the first upgrade. Four familiar weapon cards show their names and RANK 0/3 → 1/3. Read without rushing; time stays paused and no card chooses itself. Scroll and rotate safely. Which orientation makes the cards easier to read?
- [ ] Open YOUR BUILD & EVOLUTIONS beneath the cards. It shows the existing build and explains the rank-three evolution requirement. Opening/closing it does not grant or select an upgrade. A later offer starts with the reference closed.
- [ ] When a support card appears, read its current → next value. Choose one deliberately and check the corresponding HUD/build-inspection value where available. Medic healing is capped; Dash recharge depends on your survivor. One-time ability cards keep their original explanation. No particular card is guaranteed.
- [ ] Later rank/evolution cards show the correct progress when offered. Reroll and optional banish still work with fresh taps and ordinary randomness; do not expect a chosen path every time. Hold the joystick while tapping Pause after returning to play; check normal results/retry and unchanged records/settings.
- [ ] Finish/close, enable airplane mode, reopen and play briefly. Confirm 0.85 and reconnect afterward.

Does this make upgrade decisions quicker to understand without making the phone cards too crowded? Combat and difficulty should feel the same as 0.84; report any change.

## Verification and limits

Local targeted game checks: 53 passed, including 21 new preview/purity cases and existing random-choice/reroll/banish/input guards. Offline/UI checks: 32 passed. Both generated builders pass. An AST comparison protects every other main-game node and all existing choice callbacks, eligibility, effects, RNG, combat, saves and input; only the new read-only helper, upgrade render HTML, explanatory copy, six labels and one CSS rule differ. Embedded media and the entire HTML shell are otherwise exact. Manifest, worker and original Site identity are unchanged.

The full existing native suite plus new cases runs in GitHub before publication. Final CI counts, package/hash checks and actual deployment provenance accompany the release artifacts. VM assertions do not establish real phone layout, natural balance or device performance. No new image, audio, per-frame subsystem, save key, cloud service, engine or forced update activation is introduced.
