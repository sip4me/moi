// A photo taken from the search bar's scan buttons, handed to the scanner screen without putting
// a (possibly huge) data URI in the URL.
let pending: string | null = null;
export const handOffPhoto = (uri: string) => { pending = uri; };
export const takeHandedPhoto = () => { const p = pending; pending = null; return p; };
