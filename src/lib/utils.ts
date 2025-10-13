export const isSpotifyId = (id: string) => /^[A-Za-z0-9]{22}$/.test(id);
export const normTrackId = (v: string) => v.startsWith("spotify:track:") ? v.split(":").pop()! : v;
