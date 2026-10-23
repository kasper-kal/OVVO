# Prompt: copy the bottom nav's spring physics into this project

Paste everything below the line into the other project's agent.

---

## Goal

Give this project's bottom navigation bar the same physical feel as OVVO's floating dock. Not "some animation" — the exact motion, with the same numbers. Nothing else about the design has to match; this is only about how the bar moves under a thumb.

## The tokens (copy these values exactly)

Put them in the project's token/variable file, next to the other motion values:

```css
--press-scale: 0.97;
--hover-scale: 1.02;
--hover-lift: -4px;

--ease-press:  cubic-bezier(0.2, 0.8, 0.2, 1);      /* the press: leaves fast, no overshoot */
--ease-hover:  cubic-bezier(0.34, 1.56, 0.64, 1);   /* the jump: overshoots past the target */
--ease-settle: cubic-bezier(0.4, 0, 0.2, 1);        /* the return: leaves and arrives at rest */

--t-press: 120ms;
--t-hover: 240ms;
--t-spring: 320ms;
```

Do not change these numbers. They were tuned by sampling the real bar frame by frame, and a different value anywhere reads as a different feel.

## The three states, in this order

The bar's movement is not one transition. It is three, and each one owns a different part of the gesture. Every tab is 44×44.

**1. Press — while the finger is down.**
`transform: scale(0.97)`, `transition: transform 120ms var(--ease-press)`.
This is the immediate answer to the touch. Short, no overshoot, so it feels like pressure rather than movement.

**2. Lift — the moment the finger starts the press.**
`transform: translateY(-4px) scale(1.02)`, `transition: transform 240ms var(--ease-hover)`.
The overshoot in `--ease-hover` (it passes 1.56 on the way) is what makes this read as a little jump rather than a slide. The tab acknowledges the tap by hopping out of the bar.

Declare the lift rule **before** the `:active` rule. That way a finger that is still down shows the press, and the lift only starts to show as it lifts off.

**3. Settle — the way back down.**
300–1000ms later the tab returns to its seat on its own. Give the way down its own class, with `transition: transform var(--t-spring) var(--ease-settle)` — 320ms, easing out to rest — and clear the class after 320ms so it lands clean at `transform: none`.

This third state is the whole trick, and the one thing to get right: **the way down must not fall back to the 120ms press curve.** That curve starts at full speed, so the tab appears to snap into the bar with no movement at all. A slow, symmetric curve spreads the same 4px across the whole 320ms — gentle leaving, quickest in the middle, gentle arriving. If you skip this, the up-move will feel good and the down-move will feel broken.

## The timing, in React (adapt names, keep the numbers)

```tsx
const [dial, setDial] = useState<{ id: string; settling: boolean } | null>(null);
const liftTimer = useRef(0);
const settleTimer = useRef(0);

const lift = (id: string) => {
  window.clearTimeout(liftTimer.current);
  window.clearTimeout(settleTimer.current);
  setDial({ id, settling: false });                       // is-lifted
  liftTimer.current = window.setTimeout(() => {
    setDial({ id, settling: true });                      // is-settling
    settleTimer.current = window.setTimeout(() => setDial(null), 320);
  }, 1000);
};

useEffect(() => () => {
  window.clearTimeout(liftTimer.current);
  window.clearTimeout(settleTimer.current);
}, []);

// on each tab:
// className={dial?.id === id ? (dial.settling ? 'is-settling' : 'is-lifted') : ''}
// onPointerDown={() => lift(id)}
```

`pointerdown`, not click: the response has to start the instant the thumb lands. The 1000ms hold is the tab sitting up long enough to be felt, then putting itself down whether or not anything else is touched. Both timers cleared on unmount, or a fast navigation leaves a timer writing state to a gone component.

## Two traps that already bit another project of mine

**A finger keeps `:hover` on forever.** A phone applies `:hover` on a tap and holds it until the next touch somewhere else, so a tab styled with a hover lift stays lifted for as long as the screen is open — the active pill strains out of the bar's top edge. Put every hover-based lift behind:

```css
@media (hover: hover) and (pointer: fine) { … }
```

and let `is-lifted` handle fingers.

**Never put an overshoot curve on a colour.** `--ease-hover` overshoots on purpose; on a `background-color` that same overshoot paints a flash of the wrong colour before landing. Colour and border use a non-overshooting curve (`cubic-bezier(0.22, 1, 0.36, 1)`), movement uses the spring.

## Reduced motion

One switch, four overrides — the app's "reduce motion" setting or `prefers-reduced-motion`:

```css
:root[data-motion='reduced'] {
  --press-scale: 1;
  --hover-scale: 1;
  --hover-lift: 0px;
  --t-press: 0ms;
  --t-hover: 0ms;
  --t-spring: 0ms;
}
```

Because every rule moves through the tokens, that is enough: no transform, no duration, nothing moves. Keep it a token switch rather than a separate `transition: none` per rule, so a new control cannot forget it.

## How to prove it works

Measure it, don't eyeball it. In the browser, hold a pointer on one tab and sample `getComputedStyle(tab).transform` every 40ms:

- during press: `matrix(0.97, …)`
- after the tap: `matrix(1.02, …, -4)` — the `-4` is the lift
- still lifted at 0.9s, back to `none` by 1.4s
- the settle should show the 4px spread over the frames, not spent in the first two: roughly `-4.00 → -1.72 → -0.88 → -0.29 → -0.13 → -0.03 → 0.00`

If the first two samples take most of the distance, the settling curve is wrong — the tab is snapping.

Report the sampled numbers back when you are done.
