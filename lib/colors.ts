export const LINE_COLORS: Record<string, string> = {
    // Subway
    '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
    '4': '#00933C', '5': '#00933C', '6': '#00933C',
    '7': '#B933AD', '7X': '#B933AD',
    'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
    'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
    'G': '#6CBE45',
    'J': '#996633', 'Z': '#996633',
    'L': '#A7A9AC',
    'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
    'S': '#808183', 'FS': '#808183', 'H': '#808183',
    'SIR': '#0039A6',
};

export function getLineColor(routeId: string | undefined) {
    if (!routeId) return { bg: '#808183', text: '#FFFFFF' };

    const id = routeId.toUpperCase();
    let bg = LINE_COLORS[id];

    // Fallbacks
    if (!bg) {
        // Bus lines usually start with letters like M, B, Q, S (e.g. M15)
        // MNR lines might be numeric or named, but usually default to blue in apps if unknown
        // New Haven line specifically is Red (#EE352E) but generic fallback is Blue
        bg = '#0039A6';
    }

    // Yellow lines need black text for contrast
    const blackText = ['N', 'Q', 'R', 'W'];
    const text = blackText.includes(id) ? '#000000' : '#FFFFFF';

    return { bg, text };
}