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

Interactive workflow validation confirmed that the healthcare, professional services, retail, and SaaS & technology tabs each replaced the workflow title and all four steps with their relevant illustrative scenario. The selector reset to step 1 on industry change, while the visible step indicator progressed from step 1 to step 2 during the page session. Financial services rendered as the initial selected workflow.

The financial-services tab was also explicitly reselected and restored its digital-onboarding workflow and four relevant steps. Full-page desktop and 390px mobile captures confirmed that the tab set and four-step workflow presentation remain responsive at both breakpoints.

Explicit browser device emulation at 390px confirmed that each workflow tab—financial services, healthcare, professional services, retail, and SaaS & technology—became selected, displayed its correct scenario title, and rendered exactly four workflow steps.

Why Lumae mobile review at a 390px viewport: the compact header, eyebrow, two-line section headline, and introductory paragraph all remain legible with clear hierarchy. The first pillar uses comfortable 24px-scale internal padding, a large readable title, and restrained body-copy line length; it does not appear crowded at the top of the section. A lower-section capture is required to confirm the spacing rhythm across all four stacked pillars.

Lower-stack review confirms that the four mobile value pillars have consistent 18–20px gaps, retain comfortable inner padding, and keep headings and paragraph copy legible without collision or truncation. The long third-pillar title wraps cleanly over two lines, while body text maintains a readable measure. The only observed trade-off is intentional vertical length: each value proposition has enough breathing room for comprehension, so no typography or spacing change is recommended at the 390px breakpoint.
