# Report Builder - Angular

An AG Studio dashboard in which analysts compose their own reports from charts, grids and KPI
tiles, wrapped in a product shell: a reports sidebar, rename-in-place, and an account switcher
with a read-only and an editing persona.

```sh
npm install
npm run dev
```

## Layout

```
src/
  main.ts                         bootstraps AppComponent
  app.component.ts                owns the chrome state: selected report, report list, persona
  components/
    reports-sidebar.component.ts  the reports nav, roving tabindex and arrow-key navigation
    report-item.component.ts      one report, renameable in place
    profile-switcher.component.ts the account menu, arrow keys and Escape
    studio-canvas.component.ts    mounts Studio and hands its API back to the app
    icons.ts                      inline SVGs, so the starter needs no icon library
  shared/                  the framework-agnostic parts, shared with the other variants
    data/                  the generated AcmeSaaS retail dataset and the report state over it
    profiles.ts            the read-only and editing personas
    studioSetup.ts         the Studio wiring every variant opens on
    styles.css             the chrome's stylesheet
```

`shared/` is identical across every framework variant of this demo. Everything above it is this
variant's own code, and is the part worth reading first.

## How Angular and Studio divide the work

Angular owns the chrome - which report is selected, which persona is signed in, report names - and
Studio owns the dashboard. Studio is driven through its API rather than through inputs, because its
state is much larger than the slice this chrome cares about: `studio-canvas` mounts it once and
emits the API, and `app.component` reconciles the two.

That split is the part worth copying. Rendering Studio's whole state through Angular's own update
cycle means re-rendering a dashboard on every widget drag, which is why this demo does not.

## Using your own data

`shared/data` generates a six-table retail dataset so the demo runs with no backend. To point it at
yours, replace the `data` argument in `shared/studioSetup.ts` with your own
`AgDataSourcesDefinition`; the report state in `shared/data/mainDemoState.ts` refers to fields by
name, so it needs updating to match.
