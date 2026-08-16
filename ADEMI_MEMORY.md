# Ademi Project Memory

Updated: 2026-08-07T19:45:50.031Z
Project: spraxe-main
Project path: /Users/yeamin/Downloads/spraxe-main

## Purpose

This file preserves the working brief for Ademi runs. Use it to remember earlier user intent, requirements, and follow-up context when the chat message is short.

## Operating Rules

- Treat short user follow-ups as continuations of the same project brief.
- If previous context plus the current request is enough to act, build instead of asking the same clarification again.
- Keep this file current when the user changes the goal, product, audience, copy, design direction, or technical requirements.
- For example, if the user first asks for a landing page and later says "on Algeria", build a landing page about Algeria.

## Current Request

also when i upload any image in featured image or hero slider or info carousol next time i refresh the image is gone. fix this issue after uploading the image and link shows but disappears later. (DONE)

## Featured Image Upload Fix (2026-08-07)

Root cause: `app/admin/featured/page.tsx` only updated local React state on upload — nothing reached the database until the separate "Save Changes" button was pressed. Saves could also fail silently if the live DB lacked newer optional columns (storage_path, widths...), with only a generic error toast.

Fix (same file):
- Uploads now persist to the DB immediately (featured rows via new `persistFeaturedFields`, banner via `persistBanner` upsert into site_settings) — no Save click needed.
- Missing-column resilience: "column does not exist" errors are parsed, the offending optional column is dropped, and the write retries so the image URL always saves even on older DB schemas. Same fallback for the Add New insert.
- Toasts now show the real error; success says "Uploaded & saved".
- "Bucket: feature-image" labels now read "Storage: Cloudinary ... · uploads save automatically".
- Homepage reads featured_images with revalidate=300, so new images appear publicly within ~5 min.

## Conversation Context

[USER 2026-08-05T18:28:39.341Z]
Make the on page seo more advanced with useful functions which are absent.

[ASSISTANT 2026-08-05T18:28:39.341Z]
Let me check the current state after the interruption:

The shared components file is in place. Now I'll write the main page in two parts to avoid the size issue. Part 1 (logic):

Part 1 written. Now part 2 (the render JSX) to a temp file:

Now assemble the two parts:

Assembled (937 lines). Let me typecheck now to catch any issues early:

Network access to the npm registry is blocked in this environment, so dependencies can't be installed for a full typecheck. I'll verify the code carefully by reading it instead. Let me check the junction of the two assembled parts and the file structure:

The file is well-formed. Since Node 24 can run TypeScript directly (type-stripping), I can actually functionally test the pure audit library:

The library works, but testing revealed two bugs: the score can exceed 100 (weights sum to 110), and the auto-description is missing a space ("৳3,500.Fast"). Fixing both:

The audit engine is verified working. Now the frontend improvements — first, category pages using the new SEO overrides:

Now adding blog posts to the sitemap:

Now the product page — adding the missing Twitter card and richer merchant structured data:

Now the blog post page — Open Graph/Twitter metadata and Article structured data:

Now the FAQ page — it's currently a client component with no metadata at all. Converting to a server component with proper metadata and FAQ structured data:

All edits are in. Let me check if there's any globally installed TypeScript to validate with:

npm exists globally but isn't linked. Let me test if registry access works through it:

Network is fully blocked for npm, so I'll verify all changed files by careful review instead. Reading the remaining unverified sections:

The assembled page looks structurally sound. One critical check — the lucide-react version must contain all the icons I used:

All icons are available in lucide-react 0.446. Now verifying the other edited files:

Everything checks out. One cleanup — the FAQ page no longer needs the React import (server component, new JSX transform):

Final review of the shared components file:

All files verified. Now updating the README documentation and the project memory file:

Done! The on-page SEO is now much more advanced. Here's what you got, in plain words:

**In the admin panel (Admin → On-Page SEO):**
- **SEO health score (0–100)** for every product, with a colored badge — hover it to see exactly what to fix
- **Summary dashboard** showing your shop's average score and how many pages are Good / Needs work / Poor
- **Filters and sorting** — instantly find the weakest pages ("Worst score first", "No custom SEO", etc.)
- **Bulk auto-fill** — select products with checkboxes (or one click for everything shown) and the tool writes titles, descriptions and keywords for all *empty* fields. Your existing text is never overwritten
- **Live SEO checklist** inside the editor — as you type, it tells you if the title is too long, the description too short, keywords missing, etc., with a live score bar
- **Categories tab** — all the same tools now work for category pages too, not just products
- **Indexing tools** — one-click links to your sitemap, robots.txt, Google Search Console and Bing Webmaster Tools, plus a copy-robots button

**On the public website (what Google actually sees):**
- Product pages now send richer information to Google: price validity, delivery time (2–5 days), and your 7-day return policy — this makes products eligible for the enhanced "shopping" style listings
- Blog posts finally appear in the sitemap, and now have proper social-media cards and Article structured data
- Category pages can use your custom SEO text
- The FAQ page now has a proper title/description and FAQ structured data, so those questions can show directly in Google results

**One small thing to do when you're ready:** the category SEO needs three new columns in your database. Just open Admin → On-Page SEO — if anything is missing, a yellow banner appears with a "Copy setup SQL" button; paste it into Admin → SQL Runner and press Run. Everything else works already.

One honest note: this computer currently can't reach the package servers, so I couldn't run the full automated build check. I tested the new scoring engine directly (it scores 100/50/28 on good/medium/poor examples, exactly as designed) and carefully reviewed every changed file — but do give the admin SEO page a quick look next time the site is running.

[USER 2026-08-07T19:20:46.731Z]
for mobile web view make the below bar like this. also the above dashboard bar when i scroll hides and appears is not smooth and sometime flickers when scrolling like expanding collapsing multiple times fix this.

[ASSISTANT 2026-08-07T19:20:46.731Z]
Let me look at the current mobile bottom bar and header implementations:

Let me see the rest — the spacer and the current mobile bottom nav:

Now let me see the mobile header's right-side icons (lines 404–480):

Now the bottom bar itself — white style matching your screenshot, with Home, Categories, Cart, Track, Account:

The replacement was too large for one edit — I'll apply it in smaller pieces. First, a shared class helper for the bottom bar items:I've already applied the changes — let me verify the remaining edited section (mobile header icons) and check nothing overlaps the new white bar:

Both things are done! Here's what changed, in plain words:

**Bottom bar (now matches your screenshot)**
- It's now a **white bar with dark icons**, exactly like your image: **Home, Categories, Cart, Track, Account**
- The **Cart shows the orange count bubble** (like the "1" in your screenshot)
- **Categories** opens the side category menu with one tap
- The page you're currently on is highlighted in **blue** so people always know where they are
- Since Search and Wishlist are no longer in the bottom bar, they moved up as small icons on the **right side of the top bar** (search opens the search box, the heart shows the wishlist count)

**Top bar flicker — fixed**
- I found the real cause: when the top bar hid itself while scrolling, the page underneath secretly **shrank**, which made everything jump — the bar would pop back out, the page would grow again, and it would repeat several times. That's the "expanding/collapsing" you saw
- Now the page stays perfectly still and the bar just **slides up and down smoothly** — I also made the slide a bit quicker (about a third of a second) so it feels snappy instead of laggy
- As a bonus, I fixed the bottom spacing so the last bit of every page is no longer hidden behind the white bar, including on iPhones with the home swipe indicator

Just refresh the site on your phone and scroll up and down — the bar should now glide in and out cleanly with no jumping. I couldn't run the site on this computer to double-check (its internet is restricted), so if anything looks off, tell me what you see and I'll adjust it.

[USER 2026-08-07T19:45:50.031Z]
also when i upload any image in featured image or hero slider or info carousol next time i refresh the image is gone. fix this issue after uploading the image and link shows but disappears later.
