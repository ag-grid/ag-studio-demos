import type {
    AgBaseRegistry,
    AgBaseWidgetDefinition,
    AgDefaultWidgetDefinition,
    AgWidgetDataFormat,
    AgWidgetFieldReference,
} from 'ag-studio';

interface AnalystConsensusStyle {
    /**
     * How far, as a percentage of the last close, the average target must sit above or below it
     * to rate Overweight or Underweight. Anything within the band rates Equal Weight.
     */
    equalWeightBand?: number;
}

export interface AnalystConsensusDef {
    type: 'analystConsensus';
    dataMapping: {
        targetPrice: AgWidgetFieldReference[];
        lastClose: AgWidgetFieldReference[];
        analystCount?: AgWidgetFieldReference[];
    };
    format?: AgWidgetDataFormat<AnalystConsensusStyle>;
}

export interface PeerGroupRegistry extends AgBaseRegistry {
    widgets: readonly (AgDefaultWidgetDefinition | AgBaseWidgetDefinition<'analystConsensus', AnalystConsensusDef>)[];
}
