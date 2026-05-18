# Image generation prompts

> **Status:** the live site now uses the AI-generated images at `assets/hero-toronto.png` (Ghibli-style cherry-blossom Toronto park) and `assets/footer-toronto.png` (pixel-art Toronto park at dusk). These are the prompts that produced them, kept here in case you want to iterate.

Try these prompts in **Midjourney v6.1, Flux 1.1 Pro, Imagen 3, or Claude's image tool** — Flux + Midjourney tend to give the most consistent painterly results.

---

## 1. Hero background (`assets/hero-toronto.jpg`)

> A hand-painted Studio Ghibli–style landscape of a Toronto park in spring. The CN Tower and downtown Toronto skyline rise in the background under a clear blue sky with soft clouds. Cherry blossom trees in full bloom frame the foreground in soft pinks and whites. A small pond reflects the trees. Two anime-style figures sit together on the grass with their backs to the camera, looking out at the city. Yellow daffodils and tall green grass scatter the foreground. Painterly, warm afternoon light, golden hour. No text, no logos, no UI. Wide aspect ratio (16:9). Inspired by Makoto Shinkai and Hayao Miyazaki — soft brushwork, cinematic depth, dreamy atmosphere.

**Aspect ratio:** 16:9 (or 21:9 for ultra-wide)
**Resolution:** 2400×1350 minimum
**Save to:** `assets/hero-toronto.jpg`

After you have the image, update `styles.css`:
```css
.hero__bg {
  background-image: url('assets/hero-toronto.jpg');
}
```

---

## 2. Footer scene (`assets/footer-toronto.png`)

> A pixel-art illustration of a Toronto park path at twilight. The CN Tower glows softly in the distance between dark trees. People walk along a tree-lined path — a jogger, a couple holding hands, a person walking a dog. Wrought-iron lamp posts cast warm yellow pools of light. Lush green canopy on both sides, deep navy-violet sky, a hint of city skyline glowing on the horizon. Pixel-art style with chunky pixels, limited palette of forest greens, golds, deep blues, and warm lamp-light yellows. Cinematic, slightly nostalgic. No text, no UI. Wide aspect ratio (16:6).

**Aspect ratio:** 16:6 (panoramic strip)
**Resolution:** 2400×900 minimum
**Save to:** `assets/footer-toronto.png`

After you have the image, update `styles.css`:
```css
.foot__scene {
  background-image: url('assets/footer-toronto.png');
  filter: none;  /* you can drop the contrast/saturate tweak too */
}
```
And remove the pixel-overlay in `.foot__scene::after` if the image already has the pixel look baked in (just keep the dark gradient).

---

## 3. (optional) Student/idea grid images

The mockup uses 4 selfie-style photos in the "Your story begins this summer" section and 2 dramatic red/blue lit photos in "Work on ideas that excite you." Right now those are Unsplash placeholders. If you want custom illustrations matching the painterly hero style:

> 2:3 portrait painting, anime/Ghibli style, of a young person at their laptop in a warm room, soft lamp light, expressive face, looking excited about an idea. Painterly, no text or logos.

Generate 4 variations for the first grid, 2 darker / more dramatic ones (red-lit and blue-lit) for the second.

---

## Tips

- **Keep them off-center:** the GI hero has the figures at the bottom-third, leaving the upper two-thirds for sky + skyline. Mirror that composition so the title text has space to breathe.
- **Avoid faces in detail:** painterly distance shots of figures (silhouettes, backs of heads) age better than close-up faces.
- **Match the color temperature:** warm afternoon golden light in the hero, cool dusky blue-purple in the footer — this contrast is what makes the GI site feel cinematic.
- **No text in the image:** all text is rendered in HTML/CSS so it stays crisp and editable.
