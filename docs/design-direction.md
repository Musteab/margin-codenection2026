# Design Direction

Margin pairs cinematic visuals with a simple, task-focused planner. Liquid-glass artwork and video create a moving environment around stationary content. The dark palette, lime accent, translucent surfaces and generous spacing connect every screen without adding extra decisions.

## The scenes

| Scene | Visual behaviour | Useful interaction |
|---|---|---|
| Opening | Liquid-glass artwork, motion footage and animated type | Explore the idea, then get started |
| Welcome | A three-step introduction and a concrete example | Start a guided sample or explore independently |
| Week | A plain workload sentence and a daily agenda | See the next task, review commitments and find room |
| Semester | Upcoming deadlines with optional week estimates | Inspect a future busy period when needed |
| Life Inbox | One prominent sample action; optional inputs behind disclosures | Try a syllabus or capture a local filename/note |
| Source review | A short source excerpt and two review fields | Confirm the deadline and work estimate |
| What if | A shift-length slider and a plain-language result | Preview the effect without changing the current plan |
| Rebalance | Suggestions, pending state and confirmed result shown in sequence | Approve a change and understand what remains unresolved |
| Recovery | A quiet optional timer | Start, pause or reset a minute of downtime |
| Preferences | A compact form with optional personal check-ins | Adjust the demo’s personal assumptions |

## Iteration

The first interface used conventional dashboard layouts. Feedback led to a cinematic opening, followed by animated scenes across the product. A further review found that the result was overstimulating and made the next action unclear. The next version simplified navigation and removed the decorative motion. Feedback clarified that simplicity meant fewer decisions, not removing the visual identity.

The current version keeps three primary destinations and progressive disclosure while restoring the moving environment. Inspired by [Neonikala](https://neonikala.com/), the background moves while controls stay anchored; page changes have a brief reveal that settles; confirmed changes receive a single light response. There are no loading gates, forced scroll sequences or animated input fields. All imagery and footage have their own provenance and are not copied from the reference site.

The guided sample teaches the actual workflow rather than explaining every feature at once: add a syllabus, inspect the week, then approve a lighter plan. The tour can be exited at any point and replayed through More → Quick tour. Completing or skipping the introduction is remembered in the browser; the sample planning changes remain session-only.

This is product-design feedback, not a mentor consultation or a usability-study result.

## Accessibility and control

Video and slow artwork motion occupy the background, with dark reading surfaces under the content. A visible motion control pauses the experience; reduced-motion preferences reveal content immediately and keep media still. Labelled buttons, native disclosure controls and keyboard input support the essential flow. The daily agenda is the default on desktop and mobile, with the full calendar available on demand. Status is expressed in text, not colour alone. Detail views do not alter the workload calculation.

## Original artwork brief

The Margin portal was created with the built-in image-generation tool. The final brief requested a wide cinematic composition with a luminous, irregular optical-glass loop floating in a black void, liquid iridescent surfaces, acid-lime rim lighting, cyan and subtle violet refraction, and dark space for typography. It excluded text, logos, robots, literal clocks and UI elements.

The project asset is `dist/assets/margin-portal.png`. Motion-footage provenance and licensing are recorded in [Third-party notices](../THIRD-PARTY-NOTICES.md).
