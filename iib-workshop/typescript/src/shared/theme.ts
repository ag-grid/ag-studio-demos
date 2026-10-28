import type { AgStudioTheme } from 'ag-studio';
import { studioTheme } from 'ag-studio';

import type { FontFamilyValue, StudioParamMap, StudioPreset } from './theme/presets';
import { INTER, STUDIO_PRESETS } from './theme/presets';

export type ThemeMode = 'light' | 'dark';

/** Categorical series colours, in assignment order. */
const IIB_FILLS = [
    '#FF6B5B', // coral
    '#3FC1C9', // teal
    '#F5C542', // mustard
    '#7FB069', // sage
    '#E86A92', // dusty pink
    '#9B8BD9', // lavender
    '#5BA3E0', // sky
    '#D97D3F', // rust
    '#C4D64B', // lime
    '#E8A0BF', // blush
] as const;

/**
 * Quicksand is the face Information is Beautiful set their own site in, so the house preset
 * uses it rather than a lookalike. Loaded from Google Fonts like every other preset's face.
 */
const QUICKSAND: FontFamilyValue = [{ googleFont: 'Quicksand' }, 'sans-serif'];

/**
 * Every font surface Studio renders, which is what the shipped presets set too. Setting
 * only `fontFamily` leaves the text widget on Studio's own default, because it reads
 * `studioCanvasFontFamily` rather than inheriting.
 */
const houseFonts = (family: FontFamilyValue): StudioParamMap => ({
    fontFamily: family,
    fontSize: 13,
    // Quicksand is a light geometric face: at 400 its thin, even strokes wash out against a
    // pale ground, so the house preset runs a step heavier throughout.
    fontWeight: 500,
    gridCellFontWeight: 500,
    studioWidgetCaptionFontWeight: 500,
    gridFontFamily: family,
    gridHeaderFontFamily: family,
    gridCellFontFamily: family,
    chartFontFamily: family,
    studioPanelHeaderFontFamily: family,
    studioCanvasFontFamily: family,
    studioWidgetTitleFontFamily: family,
    studioWidgetSubtitleFontFamily: family,
    studioWidgetCaptionFontFamily: family,
});

const iibPalette = (fills: readonly string[]): StudioParamMap =>
    Object.fromEntries(fills.map((value, i) => [`chartPaletteFills${i + 1}Color`, value]));

/** Information is Beautiful "signature dark", and the same house style on paper. */
const IIB_PRESET: StudioPreset = {
    id: 'iib',
    label: 'Information is Beautiful',
    variants: {
        // Only the type and the series colours: the surfaces come from `SURFACES` below,
        // the same as for every other preset. The coral darkens on a light ground so it
        // stays legible as an accent.
        light: {
            accent: '#D8402D',
            background: '#F4F3EF',
            params: { ...houseFonts(QUICKSAND), ...iibPalette(IIB_FILLS) },
        },
        dark: {
            accent: '#FF6B5B',
            background: '#1A1C22',
            params: { ...houseFonts(QUICKSAND), ...iibPalette(IIB_FILLS) },
        },
    },
};

/** The house style first, then the Theme Builder's own, with its `default` given a name. */
export const THEME_PRESETS: StudioPreset[] = [
    IIB_PRESET,
    ...STUDIO_PRESETS.map((preset) => (preset.id === 'default' ? { ...preset, label: 'Studio Classic' } : preset)),
];

export type ThemePresetId = string;

export const presetById = (id: ThemePresetId): StudioPreset =>
    THEME_PRESETS.find((preset) => preset.id === id) ?? IIB_PRESET;

// The accent stays coral: AG Grid derives selection, hover and focus surfaces from `accentColor`.
const HOUSE_ACCENT = { light: '#D8402D', dark: '#FF6B5B' } as const;

// One neutral shell per mode: a preset changes type and chart palette only, not surface tints.
const SURFACES = {
    light: {
        sidebar: '#EAE8E1',
        canvas: '#F4F3EF',
        widget: '#FFFFFF',
        raised: '#EDECE6',
        text: '#1A1C22',
        subtle: '#6B6F79',
        gridLine: '#E4E2DB',
        axisLine: '#C9C7BF',
        border: '#DFDDD5',
    },
    dark: {
        sidebar: '#16181D',
        canvas: '#1A1C22',
        widget: '#24272F',
        raised: '#2E323C',
        text: '#F2F0EB',
        subtle: '#8B8F9A',
        gridLine: '#33363F',
        axisLine: '#454954',
        border: '#343842',
    },
} as const;

/** The only keys a preset is allowed to contribute: its type and its series colours. */
const isFontKey = (key: string) => /^font(Family|Size|Weight)$|Font(Family|Size|Weight)$/.test(key);
const isPaletteKey = (key: string) => /^chartPaletteFills\d+Color$/.test(key);

function presetContribution(preset: StudioPreset, mode: ThemeMode): StudioParamMap {
    const params = preset.variants[mode].params;
    return Object.fromEntries(Object.entries(params).filter(([key]) => isFontKey(key) || isPaletteKey(key)));
}

/** A Theme Builder font value as a CSS font-family string. */
const fontCss = (value: FontFamilyValue): string =>
    value.map((part) => (typeof part === 'string' ? part : `"${part.googleFont}"`)).join(', ');

/** The Google families a preset needs, for the one stylesheet link the frame keeps. */
export const googleFonts = (value: FontFamilyValue): string[] =>
    value.flatMap((part) => (typeof part === 'string' ? [] : [part.googleFont]));

export interface Palette {
    /** The sidebar rail, a step away from the canvas so the shell reads as chrome. */
    sidebar: string;
    canvas: string;
    widget: string;
    raised: string;
    text: string;
    subtle: string;
    gridLine: string;
    axisLine: string;
    border: string;
    accent: string;
    font: string;
    fills: string[];
}

/**
 * Every colour and face the app needs: the mode's neutral surfaces, plus the preset's own
 * type and series palette.
 */
function resolvePalette(preset: StudioPreset, mode: ThemeMode): Palette {
    const contributed = presetContribution(preset, mode);
    const fills = Object.keys(contributed)
        .filter(isPaletteKey)
        .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')))
        .map((key) => contributed[key] as string);

    return {
        ...SURFACES[mode],
        accent: HOUSE_ACCENT[mode],
        font: fontCss((contributed['fontFamily'] as FontFamilyValue | undefined) ?? INTER),
        fills: fills.length ? fills : [...IIB_FILLS],
    };
}

/** The live palette, read by the custom widgets on every refresh. Mutated only by `setActivePreset`. */
export const IIB: Palette = resolvePalette(IIB_PRESET, 'dark');

export function setActivePreset(id: ThemePresetId, mode: ThemeMode): Palette {
    Object.assign(IIB, resolvePalette(presetById(id), mode));
    return IIB;
}

/** A series colour by index, wrapping. Preset palettes run from four colours to ten. */
export const fill = (index: number): string => IIB.fills[index % IIB.fills.length];

/** A preset's params, applied to Studio's own theme, with the widget chrome params layered on top. */
export function buildStudioTheme(id: ThemePresetId, mode: ThemeMode): AgStudioTheme {
    const preset = presetById(id);
    const palette = resolvePalette(preset, mode);
    const surface = SURFACES[mode];
    return studioTheme.withParams({
        // The shell, identical across presets.
        backgroundColor: surface.widget,
        textColor: surface.text,
        subtleTextColor: surface.subtle,
        borderColor: surface.border,
        accentColor: palette.accent,
        browserColorScheme: mode,
        studioCanvasBackgroundColor: surface.canvas,
        studioWidgetBackgroundColor: surface.widget,
        studioWidgetBorder: { width: 1, color: surface.border },
        studioWidgetBorderRadius: 10,
        studioWidgetPadding: 8,
        studioWidgetTitleTextColor: surface.text,
        studioWidgetTitleFontSize: 14,
        studioWidgetTitleFontWeight: '500',
        studioWidgetSubtitleTextColor: surface.subtle,
        studioWidgetCaptionTextColor: surface.subtle,
        gridRowBorder: { width: 1, color: surface.border },
        gridHeaderRowBorder: { width: 2, color: surface.border },
        chartTextColor: surface.text,
        chartSubtleTextColor: surface.subtle,
        chartAxisLineColor: surface.axisLine,
        chartGridLineColor: surface.gridLine,
        studioToggleButtonActiveBackgroundColor: palette.accent,
        studioToggleButtonActiveBorderColor: palette.accent,
        // The glyph, not the fill. Studio's default sets all three params to the same
        // colour, which paints an active Bold or Italic button as a solid block with its
        // own icon invisible inside it. The content has to contrast with the fill behind it.
        studioToggleButtonActiveColor: surface.widget,

        // What the preset actually brings.
        ...presetContribution(preset, mode),
    });
}
