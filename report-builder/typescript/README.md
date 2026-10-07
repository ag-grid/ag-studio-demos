# Report Builder - TypeScript

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
  main.ts               mounts the demo into #app
  reportBuilderDemo.ts  the demo: report selection, New report, rename, profile switching
  chrome.ts             builds the product shell as plain DOM
  demo/                 the framework-agnostic parts, shared with the other variants
    data/               the generated AcmeSaaS retail dataset and the report state over it
    report-builder/     the demo personas, the Studio wiring, and the chrome's stylesheet
```

`demo/` is identical across every framework variant of this demo. Everything above it is this
variant's own code, and is the part worth reading first.

## Using your own data

`demo/data` generates a six-table retail dataset so the demo runs with no backend. To point it at
yours, replace the `data` argument in `demo/report-builder/studioSetup.ts` with your own
`AgDataSourcesDefinition`; the report state in `demo/data/mainDemoState.ts` refers to fields by
name, so it needs updating to match.
