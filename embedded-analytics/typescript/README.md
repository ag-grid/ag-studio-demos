# In-App Reporting - TypeScript

AG Studio widgets embedded in someone else's page. The host here is an equity research note on a
peer group; its overview figures are live Studio viewports, and selecting a company opens a full
report for it in a popup - the in-app reporting pattern, where the report is part of the product
rather than a separate analytics tool.

```sh
npm install
npm run dev
```

## Layout

```
src/
  main.ts                   mounts the demo into #app
  embeddedAnalyticsDemo.ts  the demo: the overview viewports, and opening the company report
  demoPage.ts               renders the host research note as plain DOM
  companyReportPopup.ts     the popup the company report opens in
  analystConsensus.ts       this variant's rendering of the custom consensus widget
  shared/                 the framework-agnostic parts, shared with the other variants
    data.ts               the peer-group dataset and the data engine over it
    company.ts            one company's view of that dataset
    overview.ts           the overview page's figures, formatted once
    analystConsensus.ts   the custom analyst-consensus widget and the rating it derives
    interfaces.ts         the widget's own types, including its registry entry
    state.ts              the report each embedded viewport opens on
    studioSetup.ts        the Studio wiring: embedded viewports, and the company report popup
    format.ts             the number and percentage formatting the page shares
    logos.ts              inline company marks, so the starter needs no asset pipeline
    styles.css            the page's own appearance, and the report popup's
```

`shared/` is identical across every framework variant of this demo. Everything above it is this
variant's own code, and is the part worth reading first.

## The embedding pattern

Each overview viewport is its own Studio instance showing a single widget, so it reads as a figure
in the document rather than as a dashboard. The company report is a separate Studio instance opened
in a popup, driven by a drill-through filter naming the company that was selected - which is how a
host hands Studio the context the user has already chosen elsewhere in the product.

`analystConsensus.ts` is worth reading beside them: it is a custom widget type, registered through
`interfaces.ts`, showing that an embedded report can carry the host's own visualisations alongside
Studio's built-in ones.

## Using your own data

`shared/data.ts` builds the peer-group dataset so the demo runs with no backend, and
`createPeerGroupDataEngine` wraps it as Studio's data source. To point it at yours, replace that
engine with your own `AgDataSourcesDefinition`; the viewport states in `shared/state.ts` and the
report in `shared/studioSetup.ts` refer to fields by name, so they need updating to match.
