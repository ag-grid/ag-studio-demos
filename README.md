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

Real-time Dashboard sits in `service-health/`, which names the dataset it runs on rather than the
demo. Every other demo's directory matches its name.

Each project needs an AG Studio licence key to run without a watermark. See
[Licensing](https://www.ag-grid.com/studio/licensing/).

## This is the dev branch

These starters track AG Studio `latest`, which means the newest nightly on AG Grid's
registry - `3.1.0-beta.20261113.200` at the time this was published, and whatever is newest when you
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
