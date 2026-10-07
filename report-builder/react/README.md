# Report Builder - React

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
  main.tsx                 mounts <ReportBuilderApp /> into #root
  ReportBuilderApp.tsx     owns the chrome state: selected report, report list, signed-in persona
  components/
    ReportsSidebar.tsx     the reports nav, roving tabindex and arrow-key navigation
    ReportItem.tsx         one report, renameable in place
    ProfileSwitcher.tsx    the account menu, arrow keys and Escape
    StudioCanvas.tsx       mounts Studio and hands its API back to the app
    icons.tsx              inline SVGs, so the starter needs no icon library
  demo/                    the framework-agnostic parts, shared with the other variants
    data/                  the generated AcmeSaaS retail dataset and the report state over it
    report-builder/        the demo personas, the Studio wiring, and the chrome's stylesheet
```

`demo/` is identical across every framework variant of this demo. Everything above it is this
variant's own code, and is the part worth reading first.

## How React and Studio divide the work

React owns the chrome - which report is selected, which persona is signed in, report names - and
Studio owns the dashboard. Studio is driven through its API rather than through props, because its
state is much larger than the slice this chrome cares about: `StudioCanvas` mounts it once and
hands the API up, and `ReportBuilderApp` reconciles the two in effects.

That split is the part worth copying. Rendering Studio's whole state as React props means
re-rendering a dashboard on every widget drag, which is why this demo does not.

## Using your own data

`demo/data` generates a six-table retail dataset so the demo runs with no backend. To point it at
yours, replace the `data` argument in `demo/report-builder/studioSetup.ts` with your own
`AgDataSourcesDefinition`; the report state in `demo/data/mainDemoState.ts` refers to fields by
name, so it needs updating to match.
