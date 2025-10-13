import { NeoBtn, NeoSurface } from "../neo/Neo";

export default function SpotifyBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <NeoSurface className="p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">Connect Spotify</div>
        <p className="text-sm text-[var(--neo-muted)]">
          To add songs and hydrate tracks, connect your Spotify account.
        </p>
      </div>
      <NeoBtn onClick={onConnect}>Connect Spotify</NeoBtn>
    </NeoSurface>
  );
}
