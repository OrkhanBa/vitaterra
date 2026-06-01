# VitaTerra Design System (v2)

Source: UI UX Pro Max skill — Agriculture/Farm Tech + B2B Service patterns.

## Pattern

- **Hero-centric** landing with trust signals immediately below fold
- **Feature-rich showcase** for product portfolio
- **Trust & authority** for B2B crop-protection buyers

## Style

- **Organic Biophilic** — earth greens, warm cream, natural radii (16–20px)
- **Minimal motion** — 200ms transitions, scroll reveal, no layout-shift hovers
- **Glass cards** on hero stats with gold accent top border

## Colors (keep brand)

| Token | Value | Use |
|-------|-------|-----|
| `--green-dark` | #1a3a2a | Nav, headings, primary buttons |
| `--green-mid` | #2d5c3f | Gradients |
| `--green-accent` | #3e8c58 | Labels, focus rings |
| `--gold` / `--gold-light` | #c9a84c / #e8c96a | CTAs, highlights |
| `--cream` / `--cream-warm` | #f7f4ee / #f0ebe3 | Page background, trust strip |
| `--text-mid` | #475569 | Body (WCAG-friendly muted) |

## Typography

- **Display:** Playfair Display (headings)
- **Body:** DM Sans (UI, paragraphs)

## Components (v2)

- Floating nav shell (`max-width: 1200px`, `border-radius: 16px`)
- Trust strip — 4 certification/partner badges
- Stat cards — SVG icons (no emoji)
- Product cards — tilt effect + cream section background
- Contact — icon boxes + elevated form card

## Anti-patterns (avoid)

- Emoji as UI icons
- Hover `translateY` on cards (layout shift)
- Purple/pink AI-gradient aesthetics
- Low-contrast gray body text (#888)

## Stack

Single-file `index.html` — vanilla CSS/JS only (no Tailwind build).
