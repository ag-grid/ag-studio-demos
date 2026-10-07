# AG Studio Demos

Runnable demo applications built with [AG Studio](https://www.ag-grid.com/studio/). Each one is a
standalone project: take the folder for the demo and framework you want, and run it.

```sh
cd report-builder/react
npm install
npm run dev
```

The TypeScript, React and Vue projects are built with Vite; the Angular ones with the Angular CLI.
Either way `npm run dev` is the command.

## Demos

### Report Builder

An analyst-facing app shell in which reports are composed from charts, grids and KPI tiles, with a
reports sidebar, rename-in-place and an account switcher offering a read-only and an editing
persona.

- [`report-builder/typescript`](./report-builder/typescript)
- [`report-builder/react`](./report-builder/react)
- [`report-builder/vue3`](./report-builder/vue3)
- [`report-builder/angular`](./report-builder/angular)

### Widget Library

A ready-made dashboard assembled from a curated catalogue of pre-built widgets. An administrator
drags in widgets that are already bound to the data, so nobody authors a widget or edits an
expression.

- [`widget-library/typescript`](./widget-library/typescript)
- [`widget-library/react`](./widget-library/react)
- [`widget-library/vue3`](./widget-library/vue3)
- [`widget-library/angular`](./widget-library/angular)

### Embedded Analytics

AG Studio widgets embedded in someone else's document - a research tear sheet - styled to match it,
with the host application owning the data and the surrounding chrome. Each widget can be expanded
in place for editing.

- [`embedded-analytics/typescript`](./embedded-analytics/typescript)
- [`embedded-analytics/react`](./embedded-analytics/react)
- [`embedded-analytics/vue3`](./embedded-analytics/vue3)
- [`embedded-analytics/angular`](./embedded-analytics/angular)

## How these are laid out

Every project has the same shape:

```
src/
  <this framework's own code>   the part worth reading
  demo/                         the framework-agnostic parts
    <demo>/                     the demo's Studio configuration, dataset and stylesheet
```

`src/demo` is identical in every framework variant of a demo. Everything above it is idiomatic code
for that framework, and is where to look first.

Each project needs an AG Studio licence key to run without a watermark. See
[Licensing](https://www.ag-grid.com/studio/licensing/).

> Generated from the AG Studio repository. Edits made here are not carried back upstream.
