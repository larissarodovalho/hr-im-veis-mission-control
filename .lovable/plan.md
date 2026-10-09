# Make the large photo on the property page sharp

## Problem
On the property page, the large photo is downloaded as a reduced copy: 1920 px wide at about 78% quality. On larger computer screens and Mac/Retina screens, the browser has to stretch that copy to 2 or 3 times its size, so it looks blurry. The preview inside Lovable runs in a smaller window, which is why it looks fine there.

## What changes
1. **Large photo (gallery):** the browser picks the right size for the screen (1280, 1920 or 2500 px, at 90% quality). On large or Retina screens, it falls back to the **original photo** with no compression.
2. **Full-screen view** (if there is one): always uses the original photo.
3. **Small photos below the main one:** go up to 600 px so they stay sharp on Retina screens.
4. **Property list cards:** get the same automatic choice, with 700 or 1400 px versions.

Loading stays fast on phones: small screens still get the smaller versions.

## Technical details
- `src/lib/imagemOtimizada.ts`: add `srcSetOtimizado(url, larguras[])` and the original URL as a fallback. Raise IMG_HERO to quality 90 and drop `resize=cover` when only the width is set, to avoid a crop or loss of detail.
- `ImovelDetalhePage.tsx` (lines ~143, 248, 301) and `ImoveisPage.tsx` card: use `srcSet` + `sizes`.
- Check with Playwright at 1920 px wide with device scale factor 2 that the downloaded photo is ≥ 2500 px or the original.
