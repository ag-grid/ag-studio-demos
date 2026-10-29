# AG Studio Demos

Runnable demo applications built with [AG Studio](https://www.ag-grid.com/studio/). Each one is a
standalone project: take the folder for the demo and framework you want, and run it.

```sh
cd report-builder/typescript
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

### IIB Workshop

The starter for the AG Studio x Information is Beautiful workshop: an AG Studio dashboard over
Information is Beautiful datasets, with custom widgets and theme presets. TypeScript only, and it also depends on
`ag-charts-enterprise` and `qrcode-generator`. Its README explains how to run it and regenerate its
data.

- [`iib-workshop/typescript`](./iib-workshop/typescript)

## How these are laid out

Every project has the same shape:

```
src/
  <this framework's own code>   the part worth reading
  shared/                       the demo's Studio configuration, dataset and stylesheet
```

`src/shared` is identical in every framework variant of a demo. Everything above it is idiomatic
code for that framework, and is where to look first. Each project has its own README describing
its layout in full.

Each project needs an AG Studio licence key to run without a watermark. See
[Licensing](https://www.ag-grid.com/studio/licensing/).

## This is the dev branch

These starters track AG Studio `latest`, which means the newest nightly on AG Grid's
registry - `3.0.0-beta.20261029.732` at the time this was published, and whatever is newest when you
install. They use APIs the released version does not have, so they do **not** build against
it. The default branch carries starters that do.

The nightly is published to AG Grid's registry rather than to npm, so point npm at it
before installing - in the project you copied out, or globally:

```sh
npm config set registry https://registry.ag-grid.com --location project
npm install
```

Without that, `npm install` fails with a 404 on a version that looks like it should exist.

> Generated from the AG Studio repository. Edits made here are not carried back upstream.
