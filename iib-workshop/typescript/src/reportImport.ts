import type { AgBaseRegistry, AgCoreStudioErrorRaisedEvent, AgReportState, AgStudioApi } from 'ag-studio';

/**
 * Applies an imported report configuration, and turns it away if Studio raises problems with it.
 *
 * `onErrorRaised` must be passed to Studio, as that is the only way it reports what it could not
 * load. A rejected import leaves the report and the undo history as they were, so Undo never steps
 * back to a configuration the participant was told was rejected.
 */
export const createReportImport = <TRegistry extends AgBaseRegistry>(getStudio: () => AgStudioApi<TRegistry>) => {
    /** Set while an import is being applied, so the state errors Studio raises for it are kept. */
    let problems: string[] | undefined;

    const newestUndoId = (studio: AgStudioApi<TRegistry>) => studio.getHistory().undo.at(-1)?.id;

    return {
        onErrorRaised: ({ errorType, errorDetails }: AgCoreStudioErrorRaisedEvent) => {
            if (errorType === 'state') {
                problems?.push(...errorDetails);
            }
        },

        /** Resolves to the problems Studio raised; empty when the import was accepted. */
        importState: async (state: unknown): Promise<string[]> => {
            const studio = getStudio();
            const previous = studio.getState();
            const undoIdBefore = newestUndoId(studio);
            const raised: string[] = [];
            problems = raised;
            try {
                studio.setState(state as AgReportState<TRegistry>);
                // Studio repairs what it can and reports the rest through `errorRaised`, which it
                // delivers on a later task rather than from `setState`, so wait for that task.
                await new Promise((resolve) => setTimeout(resolve, 0));
            } catch (error) {
                raised.push((error as Error).message);
            } finally {
                problems = undefined;
            }
            if (raised.length > 0) {
                // Undone rather than overwritten, so the rejected configuration is not left as a step
                // that Undo returns to.
                if (newestUndoId(studio) !== undoIdBefore) {
                    studio.undo();
                }
                // Undo keeps the imported selection and panels; this puts those back too, and records
                // nothing because the report itself is already back as it was.
                studio.setState(previous);
            }
            return raised;
        },
    };
};
