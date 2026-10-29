import type { AgStudioApi, AgStudioProperties } from 'ag-studio';
import { createStudio, createWidgets } from 'ag-studio';

import type { ServiceHealthRegistry } from './shared';
import {
    LiveFeed,
    ServiceHealthSimulation,
    UPDATE_INTERVALS,
    serviceHealthProperties,
    serviceHealthWidgets,
} from './shared';

export interface ServiceHealthDemoOptions {
    /** Element the demo renders into. Its content is removed again on destroy. */
    container: HTMLElement;
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties<ServiceHealthRegistry>>;
}

export interface ServiceHealthDemo {
    readonly api: AgStudioApi<ServiceHealthRegistry>;
    destroy: () => void;
}

/**
 * Mount the Real-time Dashboard demo: a monitoring dashboard over a simulated fleet of services,
 * kept live by applying the fleet's changes to Studio's data engine every second.
 *
 * The toolbar above the canvas pauses and resumes the feed and sets how often it updates.
 */
export function createServiceHealthDemo(options: ServiceHealthDemoOptions): ServiceHealthDemo {
    const { container, studioOverrides } = options;

    const root = document.createElement('div');
    root.className = 'agd-sh';
    root.innerHTML = `
        <div class="agd-sh-toolbar">
            <h1 class="agd-sh-title">Service Health</h1>
            <span class="agd-sh-status" data-ref="status" role="status">Starting</span>
            <button type="button" class="agd-sh-button" data-ref="toggle">Pause</button>
            <label class="agd-sh-control">
                Update every
                <select class="agd-sh-select" data-ref="interval">
                    ${UPDATE_INTERVALS.map((ms) => `<option value="${ms}">${ms / 1000}s</option>`).join('')}
                </select>
            </label>
        </div>
        <div class="agd-sh-canvas" data-ref="canvas"></div>
    `;
    container.appendChild(root);

    const ref = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-ref="${name}"]`)!;
    const status = ref('status');
    const toggle = ref<HTMLButtonElement>('toggle');
    const interval = ref<HTMLSelectElement>('interval');

    const simulation = new ServiceHealthSimulation();
    const feed = new LiveFeed({
        simulation,
        onChange: ({ isRunning, updateInterval }) => {
            status.dataset.running = String(isRunning);
            status.textContent = isRunning ? 'Live' : 'Paused';
            toggle.textContent = isRunning ? 'Pause' : 'Resume';
            interval.value = String(updateInterval);
        },
    });

    toggle.addEventListener('click', () => (feed.isRunning ? feed.pause() : feed.start()));
    interval.addEventListener('change', () => {
        const selected = UPDATE_INTERVALS.find((ms) => String(ms) === interval.value);
        if (selected != null) {
            feed.setUpdateInterval(selected);
        }
    });

    const api = createStudio<ServiceHealthRegistry>(ref('canvas'), {
        ...serviceHealthProperties({ simulation, studioOverrides }),
        widgets: createWidgets(serviceHealthWidgets),
        onStudioReady: (event) => feed.connect(event.api.getDataEngine()),
    });

    return {
        api,
        destroy: () => {
            feed.destroy();
            api.destroy();
            root.remove();
        },
    };
}
