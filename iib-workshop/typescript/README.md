# AG Studio x Information is Beautiful - Workshop Starter

The starter app for the AG Studio x Information is Beautiful workshop. It is a report builder
preloaded for the room: two real datasets (Wikipedia edit wars and Information is Beautiful's
longevity data), eight custom widget types alongside every built-in AG Studio widget, and
Information is Beautiful's own type and palette. Participants build visualisations on top of it.
The reports that ship with it are worked examples of how each piece fits together, not something
to preserve.

It is a plain Vite + TypeScript app, and every package it installs comes from public npm. It is
self-contained: there is no server or endpoint to set up, and reports stay in the browser.

This copy is generated from the AG Studio repository on each release, so edits made here are
overwritten. Make changes in the AG Studio repository.

## Running and building

You need Node.js 18 or later.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, then write a static bundle to dist/
npm run preview  # serve the built bundle
```

## Deploying

`dist/` is a static site, so any static host can serve it. `base` is `./` in `vite.config.ts`, so
the bundle also works from a subdirectory, such as a GitHub Pages project site, without further
configuration.

Vite reads the settings in `.env` at build time and writes them into the bundle. Set them before
you build, and rebuild after you change one. Each event, or each host, therefore gets its own
build.

Without a licence key the app runs watermarked and logs a trial notice to the console. AG licence
keys are designed to ship in client-side code, so a key in the published bundle is expected.

## Configuration

Copy `.env.example` to `.env` and set `VITE_AG_LICENSE_KEY` to your AG Studio licence key. It
removes the watermark and the console trial notice. The setting is optional, and a blank value is
the same as leaving the line out.

## Setting up a new event

An event that uses these datasets, refreshed or not, needs no code changes beyond the event
config. Work through this list:

1. **Copy `.env.example` to `.env`** and add the licence key (see [Configuration](#configuration)).
2. **Edit `src/eventConfig.ts`.** Each field of `eventConfig` is documented in the file:
    - `title`, `documentTitle` and `topbarNote` - the topbar heading, the browser tab title and
      the one-line note beside the topbar controls.
    - `brand` - the logo, the light and dark wordmarks, their alternative text, the caption under
      them and the Google font it is set in. To use another partner's logos, add the SVG files to
      `src/frame/` and change the imports at the top of the file.
    - `theme` - the preset and the light or dark mode a first-time visitor sees.
    - `storageNamespace` - the prefix for everything the app saves in the browser. Change it for
      every event, so a visitor from an earlier event on the same site does not reopen that
      event's reports.
    - `showQrCode` - whether the topbar offers a QR code of the page address.
    - `studio` - the data sources, the report state a first-time visitor starts on, and the
      sidebar names of its pages.
3. **Refresh or replace the data** under `scripts/source/`, then run the `data:*` scripts (see
   [Regenerating the data](#regenerating-the-data)). Refreshing a dataset, or swapping in one of
   the same shape, needs only this step. A dataset with a different shape also means editing
   the data and report modules under `src/shared/`.
4. **Build and deploy** (see [Deploying](#deploying)).

## Regenerating the data

The two real datasets are generated TypeScript modules in `src/shared/data/`. Do not
edit `editWars.ts` or `longevity.ts` by hand.

| Script                                | What it does                                                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run data:edit-wars:fetch`        | Joins each row of `scripts/source/iib-wikipedia-edit-wars.csv` to the article's live statistics from the Wikipedia API and XTools, and writes `scripts/source/edit-wars-raw.json`. Needs network. |
| `npm run data:edit-wars`              | Builds `editWars.ts` from `edit-wars-raw.json`. Offline.                                                                                                                                          |
| `npm run data:longevity`              | Downloads the two tabs of Information is Beautiful's "Live Long & Prosper" Google Sheet to `scripts/source/`, then builds `longevity.ts`. Needs network.                                          |
| `npm run data:longevity -- --offline` | Builds `longevity.ts` from the copies already in `scripts/source/`.                                                                                                                               |

The fetch pauses about a second between articles, so a full run takes a few minutes. It prints
any article with fewer than 400 edits, which nearly always means a mis-resolved title: fix it in
`TITLE_OVERRIDES` in `scripts/fetch-edit-wars.mjs`. Several Live Long & Prosper chart titles
state findings from the longevity data, so re-check them after regenerating it. The scripts
themselves document how they clean each source.

The scripts write unformatted output. To match the committed formatting, run:

```sh
npx prettier@3 --no-config --single-quote --tab-width 4 --print-width 120 --write src/shared/data/editWars.ts src/shared/data/longevity.ts
```

## Project layout

```
src/
  main.ts                    reads .env and mounts the app into #app
  iibWorkshopDemo.ts         the app: sidebar, topbar, dialogs, saved sessions and Studio
  eventConfig.ts             everything event-specific (see Setting up a new event)
  runtimeConfig.ts           turns the .env settings into options
  frame/                     the app's chrome and dialogs, its stylesheet and the logos
  shared/
    data/                    the datasets, the joins between them, and the map topologies
    reports/                 the shipped report pages, their widgets and layout
    widgets/                 the eight custom widgets; registry.ts declares them
    theme.ts, theme/         the palette, the theme presets and the Studio theme built from them
scripts/                     data regeneration, and the source data under scripts/source/
```

## What ships

Four reports, switched from the sidebar:

| Report              | Contents                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| My report           | Empty. Participants start here and build their own                           |
| Widget Gallery      | Every widget type, built-in then custom, each labelled                       |
| Wikipedia Edit Wars | A finished report over the A (Wikipedia) tables                              |
| Live Long & Prosper | A finished health dashboard over the B (longevity) tables, with calculations |

In the Data panel every table carries its dataset's letter: **A** for the three Wikipedia
tables, **B** for the three longevity tables and **C** for the invented `(demo)` tables. Joins
exist only within A and within B, so only those tables combine in one chart. Every Widget
Gallery widget reads a `(demo)` table, which leaves the real tables entirely for participants.

Live Long & Prosper keeps six calculations in the report's `schema`, so they appear in the Data
panel ready to open and edit. A widget references a calculation by its bare id, such as
`yearsLost`, with no table prefix.

**New report** adds a blank page, switches to edit mode with Compose open, and asks for a name.
Double-click a report in the sidebar, or press F2 on it, to rename it.

## Custom widgets

| Widget                 | AG Charts capability                         |
| ---------------------- | -------------------------------------------- |
| Organization Chart     | `organization`                               |
| World Map with Bubbles | `map-shape` + `map-marker`                   |
| Route Map              | `map-line` over `map-shape-background`       |
| Bar with Error Bars    | `errorBar` on `bar`                          |
| Annotated Bar Chart    | `AnnotationsModule`                          |
| Choropleth Map         | `map-shape` + gradient legend + cross-filter |
| Sankey                 | `sankey`                                     |
| Quadrant               | `AgCharts.createQuadrantChart` preset        |

`src/shared/widgets/registry.ts` declares each type, its data mapping and its setup form. Seven widgets
extend `ChartWidgetBase`, which handles the container, stale responses, the loading and no-data
states and the chart theme, so each subclass only resolves its fields and builds its options.
The quadrant does not: it is an AG Charts preset that takes `AgQuadrantChartOptions` rather than
a `series` array. Its region names are form controls on the Format tab, because Studio rebuilds
a widget's `format` from its form and drops any key with no control behind it.

The custom widgets hide the cross-filter section of their setup form, because they do not emit
cross-filter selections. The choropleth is the exception: click a county to cross-filter the rest
of the report, ctrl/cmd-click to add to the selection, and click the background to clear it.

## Theming

The topbar has a preset dropdown and a light/dark toggle. The presets are the AG Studio Theme
Builder's own (Studio Classic, High Contrast, Midnight, Forest, Slate, Arctic, Charcoal and Plum),
copied into `src/shared/theme/presets.ts`, with the Information is Beautiful house style added as the
default. Each preset has a light and a dark variant.

A preset states only a few colours: a background, an accent, some text colours and a chart
palette. `resolvePalette` in `src/shared/theme.ts` derives the rest, so one preset styles the app's chrome,
Studio and the custom widgets alike. The custom widgets read the live palette through the `IIB`
object and the `fill(i)` accessor, which wraps because preset palettes run from four colours to
ten.

## Saving and sharing

- **Work is saved in the browser.** Every edit is written to `localStorage` under the event's
  `storageNamespace` and reloaded on the next visit, with the theme. Nothing leaves the machine.
- **Reset** (the circular arrow) discards the saved copy and reloads the shipped reports.
- **A new build moves old saves aside.** A saved session records a fingerprint of the reports it
  started from. When a new build ships different reports, the old session is moved to a separate
  key rather than deleted (only the most recent one is kept), and the new reports load.
- **Export and Import** copy Studio's whole state as JSON, to save an arrangement or hand it to
  someone. Copy and paste is the main path, because a sandboxed page can block downloads. Page
  names are not part of Studio's state, so an imported page with no saved name shows as
  "Untitled report".
- **QR code** shows the page address, for opening it on a phone. It carries the URL, not the
  report.

## Running the workshop

- **Charts respond to clicks only in View mode.** In Edit mode a click selects and drags the
  widget, so the organization chart's expanders and the choropleth's cross-filter do nothing.
  The app starts in View; participants switch to Edit to compose.
- **Change `storageNamespace` per event**, and expect returning visitors' saves to move aside when
  you change the shipped reports.
- **Collecting participants' work** is by **Export**: a participant copies their report's JSON
  and hands it over however the room prefers, and **Import** opens it.
