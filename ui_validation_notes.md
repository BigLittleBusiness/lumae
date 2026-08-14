# Home-Page CTA Stability Validation

Validated on 14 August 2026 after the button-stability patch.

The deployed home page was opened as a fresh browser navigation. The primary header and hero calls to action rendered in their expected positions, and the browser console produced no output after loading. The fix limits button transitions to visual properties, protects CTA compositing, avoids hover transforms on touch-only devices, and changes the external font display policy to avoid a late font-swap animation.

Desktop and mobile visual checks were also completed through the project preview. Automated tests and the TypeScript check passed before this validation.

## Motion refinement validation

On 14 August 2026, the refreshed development home page loaded without browser-console output. The previous continuous hero orbit and floating-card animations have been removed; the hero now uses a one-time staggered entrance and remains static after arrival. The scroll navigation is state-driven after a meaningful scroll threshold, and feature-card elevation is limited to fine-pointer devices.

After scrolling one viewport, the compact navigation remained fixed above the market-research content and exposed the early-access action without covering the active reading area.

A fresh deployed-page load after the motion update also produced no browser-console output.

The desktop browser reports a fine hover-capable pointer and exposes the enhanced feature-card elements for interactive verification.

The first capability card was brought into the desktop viewport and hovered directly; its elevated card treatment and teal benefit emphasis rendered as intended while the compact scroll navigation remained accessible.

Computed desktop hover state confirmed the expected `translateY(-5px)` elevation, white card background, and Tidal Teal icon and heading. The page exposed six `hero-arrive` animations, each with a 560ms duration and staggered 70–310ms delay; all had finished and the hero parts had settled into their final state.

The ROI calculator rendered all six editable assumptions. Doubling the monthly touchpoint scenario from 1,000 to 2,000 updated the illustrative annual retained-value display from A$108,000 to A$216,000, with actionable responses and potential recoveries also updating proportionally.
