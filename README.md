# Bulktown

Website for Bulktown, a high-protein restaurant where every dish shows its macros and is tagged for bulking or cutting.

It is a plain static site: HTML, CSS and JavaScript with no build step. Open `index.html` in a browser, or serve the folder with GitHub Pages.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `styles.css` | All styling. Brand colours are at the top (`--bulk`, `--cut`) |
| `menu.js` | The dishes, macros and protein add-ons. Edit this to change the menu |
| `app.js` | Goal picker, menu filter, the "Your day" tracker and the meal plan |
| `config.js` | Site settings. The key that makes meal plan sign-ups reach an inbox goes here |
| `images/` | Photos |

## Changing the menu

Edit `menu.js`. Each dish has its name, description, calories, protein, carbs, fat, photo and add-on. The comment at the top of the file explains each field. Add a `price` to a dish and it shows on the card.

## Meal plan sign-ups

The "Your week, planned" section builds a five-day plan from the dishes in `menu.js` and unlocks it when the visitor gives an email.

- Sign-ups are sent through [Web3Forms](https://web3forms.com). Paste the access key into `config.js`. **Until a key is set, no emails are saved.**
- Each sign-up arrives with the email, goal, meals a day, protein target, and whether they ticked the marketing box.
- Only email people marketing if `marketing_opt_in` is `Yes`. The box is unticked by default on purpose: UK rules need an active opt-in for marketing email.
- Link the privacy policy in the form (currently `#`).

## Before launch

- **Connect the meal plan form.** Add the Web3Forms key in `config.js` and send a test sign-up.

- **Macros are placeholders.** Every dish, macro and add-on figure in `menu.js` is a sample written for the design. Replace them with the kitchen's tested numbers.
- **"High protein" wording.** In the UK a food can only be called high protein if at least 20% of its calories come from protein. Two sample dishes (Quinoa Power Bowl, Chickpea & Lentil Curry Box) are under that without their add-on. Check the final menu.
- **Placeholders in `index.html`:** address, opening hours, and the links for ordering, directions, Instagram, allergens and contact (all currently `#`).
- **Background video.** Add `video/hero.mp4` (muted, 10 to 20 second loop, under 15MB) and it plays behind the top section. Until then the photo shows.
- **Search engines.** `index.html` has `<meta name="robots" content="noindex">` so the draft is not indexed. Remove that line at launch.
- **Photos.** These are stock images. Swap in real photos of the food and the restaurant when available, and check the stock licences cover this use.
