# POSTCARD social-sharing standard

Adopted 18 October 2026 at the founder's request. Applies to every public edition in editions/. Preserve the current editorial UI; sharing metadata is part of the publication render/release checks.

## Production route
1. Add the approved headline, short introduction, canonical edition URL, room and descriptive image alt text to editions/social-previews.json.
2. Store the approved illustrative/editorial picture as a versioned public JPEG/PNG under assets/social/. Preserve asset provenance and truthful labelling. Use original dimensions in the manifest. Prefer a high-resolution source (target 1200 x 630 when available); do not stretch a small image or invent new imagery just to meet a target. The inaugural LEYE image is its existing 512 x 288 original.
3. Run node scripts/social-previews.mjs. This writes Open Graph and large-image Twitter card metadata directly into HTML, without JavaScript or crawler-specific content.
4. Run npm test. CI rejects new public editions without a preview record, missing assets, mismatched headlines/canonical URLs or stale/duplicate metadata.
5. Verify anonymous GET of the deployed page and image (correct MIME type, actual dimensions and status 200); verify the metadata describes the exact edition. Then perform an actual platform preview check where accessible. No unsolicited messages are authorized by preview QA.

Open Graph title/description/image/site name represent the upper part of the edition. Platforms choose the final layout, truncation and image size; an exact screenshot-style card is not guaranteed. No logo/brand ownership or earnings claims may be invented in a sharing asset.

Source: https://ogp.me/ (checked 18 October 2026). Existing approved body text and room routing are unchanged. No paid service, tracking script or model call required. Version image filenames when an approved image changes; metadata changes may remain cached by social platforms. Re-paste the link in a new message and wait for its preview; old messages may retain an earlier card. Never promise cached messages will update.

This is implemented for public HTML editions, not proof that every legacy route or the undeployed specialist runtime is connected. New delivery paths must reuse this contract and pass the same release checks. Rollback: revert the social-preview PR; retain the approved edition and its original asset in history.
