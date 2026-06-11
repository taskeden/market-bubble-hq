// ─── NFT profile pictures ────────────────────────────────────────────────────
// Real blue-chip NFT PFPs live as images in public/brand/nft. "You" — the
// founder anchor (`u_noah`, shown as "Noah") and the local account (`u_local`) —
// are pinned to the Doodle. Other top contributors cycle the remaining four.

export const MY_PFP = "/brand/nft/doodle.png";

const OTHER_PFPS = [
  "/brand/nft/ape.png",
  "/brand/nft/penguin.png",
  "/brand/nft/punk.png",
  "/brand/nft/mfer.png",
];

const ME_IDS = new Set(["u_noah", "u_local"]);

/** Is this the account owner (the founder anchor or the local user)? */
export const isMe = (id?: string, name?: string) =>
  (!!id && ME_IDS.has(id)) || name === "Noah";

/** CryptoPunk art is natively 24px — render it crisp (nearest-neighbor). */
export const pfpPixelated = (src?: string) => !!src && src.includes("punk");

/** Real NFT PFP for a leaderboard row at 0-based rank index `i`.
 *  Me (always rank 1) → Doodle; everyone below cycles the remaining four. */
export function rankPfp(userId: string, i: number): string {
  if (ME_IDS.has(userId)) return MY_PFP;
  return OTHER_PFPS[(i - 1 + OTHER_PFPS.length) % OTHER_PFPS.length];
}
