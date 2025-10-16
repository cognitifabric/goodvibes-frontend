import { NeoBtn, NeoSurface } from "../neo/Neo";

export default function SpotifyBanner({ onConnect, spotifyLinked }: { onConnect: () => void; spotifyLinked?: boolean }) {
  return (
    <NeoSurface className="p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{spotifyLinked ? "Spotify connected" : "Connect Spotify"}</div>
        <p className="text-sm text-[var(--neo-muted)]">
          {spotifyLinked ? "Your Spotify account is connected." : "To add songs and hydrate tracks, connect your Spotify account."}
        </p>
      </div>
      {spotifyLinked ? (
        <NeoBtn disabled className="cursor-default">Connected</NeoBtn>
      ) : (
        <NeoBtn onClick={onConnect}>Connect Spotify</NeoBtn>
      )}
    </NeoSurface>
  );
}
