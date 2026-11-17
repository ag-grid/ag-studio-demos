# Real-time Dashboard - React

A monitoring dashboard over a fleet of services that updates while you watch. A simulation stands
in for a monitoring backend, and its changes are applied to Studio's data engine every second, so
the tables and charts stay live and the status table shows each change beside its value. Every
chart over time groups by the second, through a custom date grain, and a custom heatmap widget
shows each service's error rate.

```sh
npm install
npm run dev
```

## Layout

```
src/
  main.tsx             mounts <ServiceHealthApp /> into #root
  ServiceHealthApp.tsx renders <AgStudio> and the feed controls, and owns the feed's lifetime
  shared/                  the framework-agnostic parts, shared with the other variants
    simulation.ts          the simulated fleet: the tables it keeps, and how each series drifts
    liveFeed.ts            applies the simulation's changes to Studio, and owns start/pause/interval
    heatmapWidget.ts       the heatmap widget type, drawn with AG Charts
    data.ts                the field definitions, data sources and `second` grain over the simulation
    state.ts               the dashboard the demo opens on
    studioSetup.ts         the Studio wiring every variant opens with
    styles.css             the demo's stylesheet
```

`shared/` is identical across every framework variant of this demo. Everything above it is this
variant's own code, and is the part worth reading first.

## How the dashboard stays live

`simulation.ts` is the stand-in backend: every service runs in every region and environment, each
series drifts around its own baseline, and every few minutes an incident raises latency and errors
for one service before fading. It is seeded, so a reload shows the same run.

`liveFeed.ts` is the part worth copying. It applies each tick as an `AgDataTransaction` against
Studio's data engine rather than reloading the data, so Studio updates only what changed - which is
what keeps a dashboard at this update rate affordable. The feed also owns start, pause and the
update interval, so the controls each variant builds are driving one shared object.

## What this variant contributes

The simulation, the feed and the dashboard are shared. What comes from `ag-studio-react` is the
rendering - the `AgStudio` component, and `createWidgets` to register the heatmap - plus starting
the feed when the view mounts and stopping it when it unmounts.

## Using your own data

Replace the simulation with your own source: `shared/data.ts` declares the fields and data sources
the dashboard reads, and `liveFeed.ts` is where each batch of changes reaches Studio. Point that at
your feed - a WebSocket, a poll, whatever reports your fleet - and apply the same transaction shape.
The dashboard in `shared/state.ts` names fields, so it needs updating to match.
