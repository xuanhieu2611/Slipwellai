# Animation polish plan (premium feel)

Handoff for a follow-up agent. Parent work already replaced hand-rolled overlays with **Sonner**, **base-ui** (Dialog / Menu / Select), **next-themes**, and **clsx**. Dialogs, menus, filter selects, and toasts already have interruptible enter/exit transitions. Do not re-animate those unless something is broken.

## Skills to use

1. `/Users/hieule/.claude/skills/emil-design-eng/SKILL.md` - taste, frequency gates, easing, review table format
2. `/Users/hieule/.claude/skills/animate/SKILL.md` - build sequence when implementing a specific motion
3. `/Users/hieule/.claude/skills/pick-ui-library/SKILL.md` - if you need a library: **motion** for springs/layout, **NumberFlow** for counters; prefer CSS otherwise

## Non-negotiables

- Respect `prefers-reduced-motion` (already in `globals.css`; extend it for anything new).
- Gate hover motion with `@media (hover: hover) and (pointer: fine)`.
- Animate **`transform` and `opacity` only** (clip-path allowed for tab morphs).
- Never `scale(0)`; start from `scale(0.95–0.97)` + opacity.
- Use existing tokens: `--ease-out`, `--ease-in-out`, durations under ~250ms for UI.
- **Do not animate keyboard-initiated actions.** Capture is `⌘J` - keep dialog motion as-is (occasional is fine), but never add delay to the shortcut path itself.
- Keep Slipwell calm. Premium here means quiet confidence, not bounce and confetti.

## Already good (leave alone)

| Surface | Status |
| --- | --- |
| Dialog / menu / filter select | base-ui + CSS transitions |
| Toasts | Sonner |
| Buttons `:active` scale(0.97) | Present |
| Auth / onboarding `rise-in` | Present |
| Mobile capture sheet `sheet-in` | Present |
| Skeleton shimmer | Present |

## Priority backlog

Implement in this order. Each item must pass the Emil frequency + purpose gate before code.

### P0 - Highest leverage

1. **View switcher morph (Tasks: Planner / Week / List)** — done (sliding pill, CSS transform)
2. **Task complete / reopen feedback** — done (check pop + soft title opacity; week-row strike)
3. **Today Top Three drag settle** — done (dnd-kit settle with `--ease-in-out`; no `motion` install)
4. **Overview counts (Open / Today / Past / Unscheduled)** — done (`@number-flow/react`, respects reduced motion)

### P1 - Premium polish

5. **Page section enter (Today, Tasks, Work)** — rejected (tens/day nav; chrome rise is noise)
6. **Record card presence for filtered lists** — parked (list noise risk; skip until filter UX needs it)
7. **Nav current indicator** — partial (140ms color/background ease only; full morph rejected — nav is high-frequency)
8. **Empty states** — rejected (common on Today; remounts replay motion; multi-empty pile-up)
9. **Slipping signal cards** — done (`@starting-style` opacity + small Y; reduced-motion keeps opacity only)

### P2 - Only if P0/P1 feel settled

10. Routine heatmap cell complete - one-shot highlight, not a loop  
11. Filter chip `is-active` color crossfade (already instant; optional 120ms color/background ease)  
12. Install / onboarding micro-delight only on first-run screens

## Explicit non-goals

- Animating every list item on every `router.refresh()`
- Parallax, glow, blur-heavy Safari-tax effects on scroll
- Bounce springs on menus/dialogs (already correctly eased)
- A second toast or dialog animation system
- Marketing-site hero motion inside the authenticated app

## Implementation notes

- Prefer extending `src/app/globals.css` tokens over one-off magic numbers.
- If you install `motion` or `number-flow`, update `package.json` via npm and keep one lockfile.
- Verify at 360px width and with reduced-motion enabled.
- Manual check account: `test@test.com` / `testtest` on `/today` and `/tasks`.

## Definition of done

- P0 items shipped and feel intentional under slow-motion DevTools inspection  
- No animation on pure keyboard capture open path beyond existing dialog transition  
- Lint, typecheck, and a quick browser pass on Today + Tasks  
- Short note in the PR describing which opportunities were taken and which were rejected by the frequency gate
