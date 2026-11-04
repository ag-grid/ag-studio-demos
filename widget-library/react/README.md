# Widget Library - React

An AG Studio dashboard an admin composes from a curated catalogue rather than authoring widgets
from scratch: pre-built charts, grids, gauges and filters over a B2B SaaS seat-and-usage dataset,
in a Grafana-style theme.

```sh
npm install
npm run dev
```

## Layout

```
src/
  main.tsx              mounts <WidgetLibraryApp /> into #root
  WidgetLibraryApp.tsx  renders <AgStudio> over the catalogue's widgets
  shared/               the framework-agnostic parts, shared with the other variants
    library.ts          the curated catalogue: which widget types an admin can drag in
    generator.ts        the seeded seat-and-usage dataset
    data.ts             field definitions and the data sources over that dataset
    state.ts            the dashboard the demo opens on
    studioSetup.ts      the Studio wiring and the Grafana-style theme
    styles.css          the demo's stylesheet
```

`shared/` is identical across every framework variant of this demo. Everything above it is this
variant's own code, and is the part worth reading first.

## What to read first

`shared/library.ts` is the point of the demo: it declares which widget types the catalogue offers
and how each maps to data. What this variant adds comes from `ag-studio-react` - `<AgStudio>` to render the dashboard, and `createWidgets` to back the
built-in widget types with React components.

There is no chrome around the canvas here, so React's only job is that wiring.

## Using your own data

`shared/generator.ts` builds a seeded dataset so the demo runs with no backend, and
`shared/data.ts` declares the fields and sources over it. To point it at yours, replace the data
sources in `shared/data.ts` with your own `AgDataSourcesDefinition`. The catalogue in
`shared/library.ts` and the opening dashboard in `shared/state.ts` both name fields, so they need
updating to match.
