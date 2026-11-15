/*
  Bulktown menu data.

  SAMPLE NUMBERS: every dish, macro and add-on below is a placeholder written
  for the design. Replace them with the kitchen's real, tested figures before launch.

  To add or change a dish, edit this list. Each dish needs:
    id      a short unique name, no spaces
    goal    'bulk' or 'cut'
    name    dish name
    desc    one line of ingredients
    kcal    calories per serving
    p, c, f protein, carbs and fat in grams per serving
    img     photo in the images folder
    alt     what the photo shows, for screen readers
    pos     which part of the photo to keep in view (CSS object-position)
    addon   the protein extra offered on this dish
    price   optional, e.g. '£11.50'. Leave it out and no price shows.
*/

var BULKTOWN_ADDONS = {
  chicken: { off: 'Add extra chicken', on: 'Extra chicken added', short: 'extra chicken', kcal: 160, p: 31, c: 0, f: 4 },
  tofu: { off: 'Add grilled tofu', on: 'Grilled tofu added', short: 'grilled tofu', kcal: 180, p: 20, c: 3, f: 10 },
  salmon: { off: 'Make it double salmon', on: 'Double salmon added', short: 'double salmon', kcal: 240, p: 26, c: 0, f: 15 },
  whey: { off: 'Add a scoop of whey', on: 'Whey scoop added', short: 'whey scoop', kcal: 125, p: 24, c: 3, f: 2 }
};

var BULKTOWN_MENU = [
  {
    id: 'salmon', goal: 'bulk',
    name: 'Salmon, Quinoa & Roast Veg',
    desc: 'Herb-crusted salmon, quinoa, roast broccoli, sweet potato, almonds.',
    kcal: 660, p: 45, c: 62, f: 26,
    img: 'images/salmon.jpg', alt: 'Salmon fillet on quinoa with roast broccoli and sweet potato', pos: 'center',
    addon: 'salmon'
  },
  {
    id: 'thigh', goal: 'cut',
    name: 'Grilled Chicken Thigh & Greens',
    desc: 'Charred chicken thigh, crisp leaves, tomato, lemon-herb dressing.',
    kcal: 420, p: 46, c: 14, f: 20,
    img: 'images/thigh.jpg', alt: 'Sliced grilled chicken thigh on a bed of salad leaves', pos: 'center 60%',
    addon: 'chicken'
  },
  {
    id: 'curry', goal: 'bulk',
    name: 'Chickpea & Lentil Curry Box',
    desc: 'Spiced lentil curry, brown rice, chickpeas, avocado, lime.',
    kcal: 680, p: 32, c: 98, f: 18,
    img: 'images/curry.jpg', alt: 'Two meal boxes of curry, brown rice, chickpeas and avocado', pos: 'center',
    addon: 'tofu'
  },
  {
    id: 'breast', goal: 'cut',
    name: 'Chicken Breast, Beans & Tomato',
    desc: 'Grilled chicken breast, green beans, cherry tomatoes, oregano.',
    kcal: 330, p: 50, c: 14, f: 8,
    img: 'images/breast.jpg', alt: 'Grilled chicken breast with green beans and cherry tomatoes', pos: 'center 65%',
    addon: 'chicken'
  },
  {
    id: 'quinoa', goal: 'bulk',
    name: 'Quinoa Power Bowl',
    desc: 'Quinoa, roast chickpeas, kale, avocado, sugar snaps, pistachios.',
    kcal: 630, p: 24, c: 70, f: 28,
    img: 'images/quinoa.jpg', alt: 'Quinoa bowl with roast chickpeas, kale, avocado and sugar snap peas', pos: 'center',
    addon: 'tofu'
  },
  {
    id: 'oats', goal: 'cut',
    name: 'Protein Oats, Apple & Blueberry',
    desc: 'Protein-boosted oats, sliced apple, blueberries.',
    kcal: 430, p: 32, c: 58, f: 8,
    img: 'images/oats.jpg', alt: 'Bowl of oats topped with sliced apple and blueberries', pos: '55% 70%',
    addon: 'whey'
  }
];

/* The dish shown on the example label at the top of the page, per goal. */
var BULKTOWN_HERO_DISH = { all: 'salmon', bulk: 'salmon', cut: 'breast' };
