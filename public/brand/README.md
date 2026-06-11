# Brand assets

The real Market Bubble logo mark (the embossed-cardstock channel logo) is bundled
here and rendered across the app (sidebar, top bar, broadcast plate, player).

| File | What it is | Notes |
| --- | --- | --- |
| `market-bubble-mark.jpg` | The official logo mark (speech bubble + breakout chart arrow), pulled from the @MarketBubble channel at 900×900 | Embossed on cardstock — shown as a logo chip so the business-card texture reads. |

Optional upgrades you can drop in (the code picks them up via
`src/components/brand/logo.tsx`):

- A **transparent-background / vector** version of the mark for crisper edges on
  any surface — replace `market-bubble-mark.jpg` (keep the filename, or update the
  `MARK_SRC` constant).
- A full **wordmark lockup** image if you want to replace the serif "Market Bubble"
  text in the sidebar with their exact typeface.
