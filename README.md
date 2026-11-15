# Bulktown

Website for Bulktown, a high-street, high-protein kitchen (eat in or take away) serving set meals. Every meal shows its macros and is tagged for bulking or cutting.

It is a plain static site: HTML, CSS and JavaScript with no build step. Open `index.html` in a browser, or serve the folder with GitHub Pages.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `styles.css` | All styling. Brand colours are at the top (`--bulk`, `--cut`) |
| `menu.js` | The dishes, macros and protein add-ons. Edit this to change the menu |
| `app.js` | Goal picker, menu filter and the meal plan quiz |
| `config.js` | Site settings. The key that makes meal plan sign-ups reach an inbox goes here |
| `images/` | Photos |

## Changing the menu

Edit `menu.js`. Each dish has its name, description, calories, protein, carbs, fat, photo and add-on. The comment at the top of the file explains each field. Add a `price` to a dish and it shows on the card.

## Animation

Taps animate: the menu filter fades out meals that no longer fit and slides the rest into place, the example label at the top swaps like a dealt card, add-on numbers count up, and the meal plan slides between steps. The moves are in `app.js` (the Motion section); hover and press effects are at the bottom of `styles.css`. Everything switches off for visitors whose device is set to reduce motion.

## Meal plan sign-ups

The "You trained. Now eat this." section is a four-step quiz, one question per screen:

1. What's your goal? (bulking or cutting)
2. How do you train? (weights, running, sport, classes or a mix)
3. How many sessions a week? (1 to 7)
4. What did you do today? The options depend on the answer to question 2. Lifters get legs, upper body or full body. Runners get easy run, long run or speed session. Sport gets training or match day. Classes get HIIT, strength class, or yoga or Pilates. A mix gets weights, cardio, sport or a class. Everyone can pick rest day.

It then shows today's meal with the reason for it. The next six days are listed as training or rest days and stay locked until the visitor gives an email.

How meals are matched: every session in the `SESSIONS` list in `app.js` has a `lead`, which decides how the meals are ranked for that day (the `LEADS` list). Big, draining sessions (legs, long runs, match day, HIIT) lead with carbs. Strength work leads with protein. Easier training days get a balance. Rest and light days go lower on carbs with protein kept up. Later training days in the week follow the kind of training picked in question 2. Training days include the meal's protein add-on, and the same meal is never suggested two days running.

To add or change a session, edit `SESSIONS` and the `today` list for that kind of training in `TRAINING`.

- Sign-ups are sent through [Web3Forms](https://web3forms.com). Paste the access key into `config.js`. **Until a key is set, no emails are saved.**
- Each sign-up arrives with the email, goal, kind of training, sessions a week, what they did today, and whether they ticked the marketing box.
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
