# Widget Library - TypeScript

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
  main.ts               mounts the demo into #app
  widgetLibraryDemo.ts  the demo: builds the catalogue's widgets and opens Studio on them
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
and how each maps to data. `widgetLibraryDemo.ts` then passes that catalogue to `createWidgets` and hands the result to
Studio, which is all a host has to do to put its own curated set in front of an admin.

## Using your own data

`shared/generator.ts` builds a seeded dataset so the demo runs with no backend, and
`shared/data.ts` declares the fields and sources over it. To point it at yours, replace the data
sources in `shared/data.ts` with your own `AgDataSourcesDefinition`. The catalogue in
`shared/library.ts` and the opening dashboard in `shared/state.ts` both name fields, so they need
updating to match.
