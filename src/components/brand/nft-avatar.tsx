import { useMemo } from "react";
import { cn, hashString } from "@/lib/utils";

// ─── Generative NFT profile picture ──────────────────────────────────────────
// A self-contained, deterministic pixel PFP (blockies-style — the crypto-native
// identicon used by wallets / NFT avatars). Seeded from the username, so every
// member has a unique, stable collectible. No network, no external assets; a
// soft sheen overlay gives it the glossy look of collection art rather than a
// flat identicon. (Real collection PFPs — Bored Ape / Doodle / Pudgy Penguin /
// CryptoPunk / mfer — live as images in public/brand/nft and are wired through
// UserAvatar's `nftSrc`; this stays the default for everyone else.)

const SIZE = 8;

function makeBlockie(seed: string) {
  const rs = [0, 0, 0, 0];
  for (let i = 0; i < seed.length; i++) {
    rs[i % 4] = ((rs[i % 4] << 5) - rs[i % 4] + seed.charCodeAt(i)) | 0;
  }
  const rand = () => {
    const t = rs[0] ^ (rs[0] << 11);
    rs[0] = rs[1];
    rs[1] = rs[2];
    rs[2] = rs[3];
    rs[3] = (rs[3] ^ (rs[3] >>> 19) ^ t ^ (t >>> 8)) | 0;
    return (rs[3] >>> 0) / 0x100000000;
  };
  // Vivid, varied HSL triad — figure / background / accent.
  const color = () =>
    `hsl(${Math.floor(rand() * 360)} ${Math.floor(rand() * 32 + 52)}% ${Math.floor(rand() * 28 + 46)}%)`;
  const main = color();
  const bg = color();
  const spot = color();

  const dataWidth = Math.ceil(SIZE / 2);
  const mirrorWidth = SIZE - dataWidth;
  const cells: number[] = [];
  for (let y = 0; y < SIZE; y++) {
    let row: number[] = [];
    for (let x = 0; x < dataWidth; x++) row.push(Math.floor(rand() * 2.3)); // 0 bg · 1 main · 2 spot
    row = row.concat(row.slice(0, mirrorWidth).reverse());
    cells.push(...row);
  }
  return { main, bg, spot, cells };
}

export function NftAvatar({ seed, className }: { seed: string; className?: string }) {
  const { main, bg, spot, cells } = useMemo(() => makeBlockie(seed), [seed]);
  const id = useMemo(() => `nft${Math.round(hashString(seed) * 1e9).toString(36)}`, [seed]);

  return (
    <svg
      viewBox="0 0 8 8"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className={cn("block h-full w-full", className)}
      aria-hidden
    >
      <rect width="8" height="8" fill={bg} />
      {cells.map((v, i) =>
        v === 0 ? null : (
          <rect
            key={i}
            x={i % SIZE}
            y={Math.floor(i / SIZE)}
            width="1.03"
            height="1.03"
            fill={v === 1 ? main : spot}
          />
        )
      )}
      <defs>
        <radialGradient id={id} cx="30%" cy="22%" r="95%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.36" />
        </radialGradient>
      </defs>
      <rect width="8" height="8" fill={`url(#${id})`} />
    </svg>
  );
}
