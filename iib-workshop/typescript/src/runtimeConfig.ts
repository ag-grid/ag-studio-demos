/**
 * The settings a deployment supplies through `.env` rather than the event config. See
 * `.env.example` for what each one does.
 */
export interface RuntimeConfig {
    licenseKey?: string;
}

/** A blank value in `.env` is the same as leaving the line out. */
const setting = (value: string | boolean | undefined): string | undefined => {
    const text = typeof value === 'string' ? value.trim() : undefined;
    return text || undefined;
};

/**
 * Reads the runtime settings from a Vite-style environment. Takes the environment as an
 * argument rather than reading `import.meta.env`, so only the standalone entry depends on Vite.
 */
export function readRuntimeConfig(env: Record<string, string | boolean | undefined>): RuntimeConfig {
    const { VITE_AG_LICENSE_KEY } = env;
    return { licenseKey: setting(VITE_AG_LICENSE_KEY) };
}
