/* Bulktown — goal picker, menu and the step-by-step meal plan. Menu data lives in menu.js. */
(function () {
  'use strict';

  var MENU = window.BULKTOWN_MENU || [];
  var ADDONS = window.BULKTOWN_ADDONS || {};
  var HERO_DISH = window.BULKTOWN_HERO_DISH || {};
  var STORE_KEY = 'bulktown-site';

  var state = { goal: 'all', addons: {} };

  // Remember the visitor's goal between visits. Storage can be unavailable
  // (private mode, blocked cookies), so every use is guarded.
  try {
    var saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (saved.goal === 'bulk' || saved.goal === 'cut') state.goal = saved.goal;
      if (saved.addons && typeof saved.addons === 'object') state.addons = saved.addons;
    }
  } catch (e) { /* start fresh */ }

  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* not saved */ }
  }

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function dishById(id) {
    for (var i = 0; i < MENU.length; i++) { if (MENU[i].id === id) return MENU[i]; }
    return null;
  }

  // A meal's numbers, including its protein add-on when switched on.
  function macros(dish) {
    var extra = ADDONS[dish.addon];
    var on = !!(extra && state.addons[dish.id]);
    return {
      on: on,
      extra: extra,
      kcal: dish.kcal + (on ? extra.kcal : 0),
      p: dish.p + (on ? extra.p : 0),
      c: dish.c + (on ? extra.c : 0),
      f: dish.f + (on ? extra.f : 0)
    };
  }

  function arrow(direction, size, weight) {
    var path = direction === 'up' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7';
    return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + weight +
      '" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
  }

  function tag(goal, extraClass) {
    var cls = 'tag tag--' + goal + (extraClass ? ' ' + extraClass : '');
    return goal === 'bulk'
      ? '<span class="' + cls + '">' + arrow('up', 14, 3.5) + 'BULK</span>'
      : '<span class="' + cls + '">' + arrow('down', 14, 3.5) + 'CUT</span>';
  }

  /* ---------- Top section ---------- */

  function renderGoal() {
    var goal = state.goal;
    document.body.setAttribute('data-goal', goal);

    var buttons = document.querySelectorAll('.goal-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-goal') === goal ? 'true' : 'false');
    }
    var tabs = document.querySelectorAll('.tab');
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].setAttribute('aria-pressed', tabs[j].getAttribute('data-filter') === goal ? 'true' : 'false');
    }

    $('goal-line').textContent = goal === 'bulk'
      ? 'Bulking it is. The menu now shows the bigger plates with more carbs and calories.'
      : goal === 'cut'
        ? 'Cutting it is. The menu now shows the lighter plates that keep protein high.'
        : 'Tap one and the whole menu shapes itself around you.';
    $('menu-cta').textContent = goal === 'bulk' ? 'See the bulking menu' : goal === 'cut' ? 'See the cutting menu' : 'See the full menu';

    var dish = dishById(HERO_DISH[goal]) || MENU[0];
    var label = $('hero-label');
    if (!dish || !label) return;
    label.setAttribute('aria-label', 'Example Bulktown label: ' + dish.name + ', ' + (dish.goal === 'bulk' ? 'Bulk' : 'Cut') + ', ' +
      dish.kcal + ' calories, ' + dish.p + ' grams protein, ' + dish.c + ' grams carbs, ' + dish.f + ' grams fat');
    label.innerHTML =
      '<div class="label-top"><div class="label-name">' + esc(dish.name.toUpperCase()) + '</div>' + tag(dish.goal, 'tag--stamp') + '</div>' +
      '<div class="label-rule"></div>' +
      '<div class="label-kcal"><span>Calories</span><strong>' + dish.kcal + '</strong></div>' +
      '<div class="label-rule label-rule--thin"></div>' +
      '<div class="label-row label-row--strong"><span>Protein</span><span>' + dish.p + 'g</span></div>' +
      '<div class="label-row"><span>Carbs</span><span>' + dish.c + 'g</span></div>' +
      '<div class="label-row"><span>Fat</span><span>' + dish.f + 'g</span></div>' +
      '<p class="label-note">Per serving. Every meal on the menu gets a label like this.</p>';
  }

  /* ---------- Menu ---------- */

  function renderMenu() {
    var goal = state.goal;
    var shown = MENU.filter(function (d) { return goal === 'all' || d.goal === goal; });

    $('menu-summary').textContent = goal === 'all'
      ? 'Showing all ' + shown.length + ' meals.'
      : 'Showing ' + shown.length + ' ' + (goal === 'bulk' ? 'bulking' : 'cutting') + ' meals.';

    $('menu-grid').innerHTML = shown.map(function (d) {
      var m = macros(d);
      var pk = m.p * 4, ck = m.c * 4, fk = m.f * 9, total = pk + ck + fk || 1;
      var pPct = Math.round((pk / total) * 100);
      var cPct = Math.round((ck / total) * 100);
      var fPct = 100 - pPct - cPct;
      var id = esc(d.id);

      var addon = m.extra
        ? '<button type="button" class="addon" data-addon="' + id + '" data-key="addon-' + id + '" aria-pressed="' + (m.on ? 'true' : 'false') + '">' +
            '<span>' + esc(m.on ? m.extra.on : m.extra.off) + '</span><span>+' + m.extra.p + 'g protein</span></button>'
        : '';

      return '<article class="dish">' +
        '<img class="dish-photo" src="' + esc(d.img) + '" alt="' + esc(d.alt || '') + '" loading="lazy" style="object-position: ' + esc(d.pos || 'center') + '">' +
        '<div class="dish-body">' +
          '<div class="dish-top">' + tag(d.goal) + (d.price ? '<span class="dish-price">' + esc(d.price) + '</span>' : '') + '</div>' +
          '<div><h3>' + esc(d.name) + '</h3><p class="dish-desc">' + esc(d.desc) + '</p></div>' +
          '<div class="dish-kcal"><strong>' + m.kcal + '</strong> kcal</div>' +
          '<div class="macro-bar" role="img" aria-label="Share of calories: protein ' + pPct + '%, carbs ' + cPct + '%, fat ' + fPct + '%">' +
            '<div class="p" style="width:' + pPct + '%"></div><div class="c" style="width:' + cPct + '%"></div><div class="f" style="width:' + fPct + '%"></div>' +
          '</div>' +
          '<dl class="macros">' +
            '<div class="p"><dt>Protein</dt><dd>' + m.p + 'g</dd></div>' +
            '<div class="c"><dt>Carbs</dt><dd>' + m.c + 'g</dd></div>' +
            '<div class="f"><dt>Fat</dt><dd>' + m.f + 'g</dd></div>' +
          '</dl>' +
          addon +
        '</div></article>';
    }).join('');
  }

  /* ---------- Meal plan: three questions, then the answer ---------- */

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var LOCK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  // step 1 = goal, 2 = workouts a week, 3 = today's session, 4 = the answer
  var plan = { step: 1, goal: '', workouts: 0, today: '', unlocked: false, sentFor: '' };

  // Which of the next seven days are training days (T) or rest days (R),
  // starting today, for 1 to 7 workouts a week.
  var WEEK_SHAPES = { 1: 'TRRRRRR', 2: 'TRRTRRR', 3: 'TRTRTRR', 4: 'TTRTTRR', 5: 'TTTRTTR', 6: 'TTTTTTR', 7: 'TTTTTTT' };

  // What each kind of day asks for. `score` ranks the meals for that day (highest wins).
  var SESSIONS = {
    legs: { label: 'Legs day', chip: 'Legs today', head: 'YOU TRAINED LEGS. NOW EAT THIS.', score: function (d) { return d.c; }, why: 'Legs is the biggest session going, so refuel with carbs.' },
    upper: { label: 'Upper body day', chip: 'Upper body today', head: 'YOU TRAINED UPPER BODY. NOW EAT THIS.', score: function (d) { return d.p; }, why: 'Upper body day is about repair, so protein comes first.' },
    full: { label: 'Full-body day', chip: 'Full body today', head: 'YOU TRAINED FULL BODY. NOW EAT THIS.', score: function (d) { return d.c; }, why: 'A full-body session uses everything, so refuel with carbs.' },
    cardio: { label: 'Cardio day', chip: 'Cardio today', head: 'YOU DID CARDIO. NOW EAT THIS.', score: function (d) { return d.c; }, why: 'Cardio runs your energy down, so top your carbs back up.' },
    rest: { label: 'Rest day', chip: 'Rest day today', head: 'IT\'S A REST DAY. EAT THIS.', score: function (d) { return d.p - d.c / 2; }, why: 'Rest day, so go lower on carbs and keep the protein up.' },
    train: { label: 'Training day', score: function (d) { return d.p + d.c / 2; }, why: 'Training day, so a solid mix of carbs and protein.' }
  };

  // The tiles on the "what did you train today" step.
  var TODAY_CHOICES = [
    { id: 'legs', title: 'LEGS', sub: 'Squats, deadlifts, lunges' },
    { id: 'upper', title: 'UPPER BODY', sub: 'Push, pull, arms' },
    { id: 'full', title: 'FULL BODY', sub: 'A bit of everything' },
    { id: 'cardio', title: 'CARDIO', sub: 'Run, bike, class' },
    { id: 'rest', title: 'REST DAY', sub: 'Nothing today' }
  ];

  // Seven days starting today. Today's meal answers today's session; the days
  // after are training or rest days spread to match the workouts a week.
  // The same meal is never suggested two days running, and training days
  // come with the meal's protein add-on.
  function buildPlan(goal, workouts, today) {
    var pool = MENU.filter(function (d) { return d.goal === goal; });
    if (!pool.length) return [];
    var shape = WEEK_SHAPES[workouts] || WEEK_SHAPES[4];
    var types = [today];
    for (var i = 1; i < 7; i++) {
      // If today is a rest day, the week's workouts start tomorrow.
      var slot = today === 'rest' ? shape.charAt(i - 1) : shape.charAt(i);
      types.push(slot === 'T' ? 'train' : 'rest');
    }
    var todayIndex = new Date().getDay();
    var previous = null;
    return types.map(function (type, n) {
      var session = SESSIONS[type];
      var choices = pool.filter(function (d) { return pool.length === 1 || d !== previous; });
      var dish = choices.reduce(function (best, d) { return session.score(d) > session.score(best) ? d : best; });
      previous = dish;
      var extra = type !== 'rest' ? ADDONS[dish.addon] : null;
      var weekday = WEEKDAYS[(todayIndex + n) % 7];
      return {
        when: n === 0 ? 'Today · ' + weekday : n === 1 ? 'Tomorrow · ' + weekday : weekday,
        label: session.label,
        why: session.why,
        dish: dish,
        extra: extra || null,
        kcal: dish.kcal + (extra ? extra.kcal : 0),
        p: dish.p + (extra ? extra.p : 0),
        training: type !== 'rest'
      };
    });
  }

  function planTop(step) {
    var bars = [1, 2, 3].map(function (n) { return '<span' + (n <= step ? ' class="on"' : '') + '></span>'; }).join('');
    return '<div class="plan-top">' +
      '<p class="plan-progress"><span class="plan-bars" aria-hidden="true">' + bars + '</span>STEP ' + step + ' OF 3</p>' +
      (step > 1 ? '<button type="button" class="plan-back" data-plan-back>Back</button>' : '') +
      '</div>';
  }

  function pressed(on) { return on ? 'true' : 'false'; }

  function renderPlan(moveFocus) {
    var stage = $('plan-stage');
    if (!stage) return;
    var html = '';

    if (plan.step === 1) {
      var goal = plan.goal || (state.goal !== 'all' ? state.goal : '');
      html = planTop(1) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">WHAT\'S YOUR GOAL?</h3>' +
        '<div class="choices choices--2">' +
          '<button type="button" class="choice choice--bulk" data-plan-goal="bulk" aria-pressed="' + pressed(goal === 'bulk') + '">' + arrow('up', 40, 2.5) +
            '<span class="choice-title">BULKING</span><span class="choice-sub">Build muscle and size</span></button>' +
          '<button type="button" class="choice choice--cut" data-plan-goal="cut" aria-pressed="' + pressed(goal === 'cut') + '">' + arrow('down', 40, 2.5) +
            '<span class="choice-title">CUTTING</span><span class="choice-sub">Get lean and defined</span></button>' +
        '</div>';
    } else if (plan.step === 2) {
      html = planTop(2) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">HOW MANY WORKOUTS A WEEK?</h3>' +
        '<p class="plan-hint">Gym, runs, classes. It all counts.</p>' +
        '<div class="choices choices--7">' + [1, 2, 3, 4, 5, 6, 7].map(function (n) {
          return '<button type="button" class="choice choice--num" data-plan-workouts="' + n + '" aria-pressed="' + pressed(plan.workouts === n) +
            '" aria-label="' + n + (n === 1 ? ' workout' : ' workouts') + ' a week"><span class="choice-title">' + n + '</span></button>';
        }).join('') + '</div>';
    } else if (plan.step === 3) {
      html = planTop(3) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">WHAT DID YOU TRAIN TODAY?</h3>' +
        '<div class="choices choices--5">' + TODAY_CHOICES.map(function (c) {
          return '<button type="button" class="choice" data-plan-today="' + c.id + '" aria-pressed="' + pressed(plan.today === c.id) + '">' +
            '<span class="choice-title">' + c.title + '</span><span class="choice-sub">' + c.sub + '</span></button>';
        }).join('') + '</div>';
    } else {
      html = renderAnswer();
    }

    stage.innerHTML = html;
    if (moveFocus) {
      var heading = $('plan-q');
      if (heading) heading.focus();
    }
  }

  function renderAnswer() {
    var days = buildPlan(plan.goal, plan.workouts, plan.today);
    if (!days.length) return '<p>No meals on the menu for that goal yet.</p>';
    var today = days[0];
    var session = SESSIONS[plan.today];
    var training = days.filter(function (d) { return d.training; }).length;

    var answers = '<ul class="plan-answers">' +
      '<li>' + (plan.goal === 'bulk' ? 'Bulking' : 'Cutting') + '</li>' +
      '<li>' + plan.workouts + (plan.workouts === 1 ? ' workout' : ' workouts') + ' a week</li>' +
      '<li>' + session.chip + '</li></ul>';

    var todayCard = '<div class="today">' +
      '<img class="today-photo" src="' + esc(today.dish.img) + '" alt="' + esc(today.dish.alt || '') + '" style="object-position: ' + esc(today.dish.pos || 'center') + '">' +
      '<div class="today-body">' +
        '<p class="day-when">' + esc(today.when.toUpperCase()) + '</p>' +
        '<h4>' + esc(today.label.toUpperCase()) + '</h4>' +
        '<p class="day-why">' + esc(today.why) + '</p>' +
        '<div class="day-meal"><span class="day-eat">Eat this</span>' +
          '<span class="day-meal-name">' + esc(today.dish.name) + '</span>' +
          '<span class="day-meal-line">' + today.kcal + ' kcal · ' + today.p + 'g protein</span>' +
          (today.extra ? '<span class="day-extra">With ' + esc(today.extra.short) + ' for ' + today.extra.p + 'g more protein.</span>' : '') +
        '</div>' +
      '</div></div>';

    var rows = days.slice(1).map(function (d) {
      var right = plan.unlocked
        ? '<div class="week-meal"><span class="day-meal-name">' + esc(d.dish.name) + '</span>' +
            '<span class="day-meal-line">' + d.kcal + ' kcal · ' + d.p + 'g protein' + (d.extra ? ' · with ' + esc(d.extra.short) : '') + '</span></div>'
        : '<span class="week-lock">' + LOCK + 'Locked</span>';
      return '<li><div class="week-day"><span class="day-when">' + esc(d.when.toUpperCase()) + '</span><strong>' + esc(d.label) + '</strong></div>' + right + '</li>';
    }).join('');

    var below = plan.unlocked
      ? '<div class="plan-actions"><button type="button" class="plan-back" data-print>Print or save as PDF</button></div>' +
        '<p class="plan-foot">This is your Bulktown meal for each day, not everything you eat. How much you need depends on your size and training.</p>'
      : '<form class="unlock" id="plan-unlock" novalidate>' +
          '<h5>Unlock the next six days</h5>' +
          '<p class="plan-small">Free. Enter your email and the full week appears right here.</p>' +
          '<div class="field"><label for="plan-email">Email</label>' +
            '<input type="email" id="plan-email" autocomplete="email" placeholder="name@example.com" aria-describedby="plan-email-error" required>' +
            '<p class="field-error" id="plan-email-error" role="alert"></p></div>' +
          '<label class="check" for="plan-optin"><input type="checkbox" id="plan-optin">' +
            '<span>Email me Bulktown news and offers too. You can unsubscribe at any time.</span></label>' +
          '<div class="hp" aria-hidden="true"><label for="plan-company">Company</label><input type="text" id="plan-company" tabindex="-1" autocomplete="off"></div>' +
          '<button class="btn btn--ink" type="submit" id="plan-submit">Unlock my week</button>' +
          '<p class="plan-small"><a href="#">Privacy policy</a></p>' + // TODO: link the privacy policy
        '</form>';

    return '<div class="plan-top">' + answers + '<button type="button" class="plan-back" data-plan-restart>Start again</button></div>' +
      '<h3 class="plan-q" id="plan-q" tabindex="-1">' + session.head + '</h3>' +
      '<div class="plan-result">' + todayCard +
        '<div class="week"><div><h4>' + (plan.unlocked ? 'YOUR BULKTOWN WEEK' : 'THE REST OF YOUR WEEK') + '</h4>' +
          '<p class="week-sum">' + training + ' training ' + (training === 1 ? 'day' : 'days') + ' and ' + (7 - training) + ' rest ' + (7 - training === 1 ? 'day' : 'days') + ', each with its own meal.</p></div>' +
          '<ul class="week-list">' + rows + '</ul>' + below +
        '</div>' +
      '</div>';
  }

  function sendSignup(payload) {
    var key = window.BULKTOWN_FORM_KEY;
    if (!key) {
      if (window.console) console.warn('Bulktown: no form key set in config.js, so this sign-up was not saved.');
      return Promise.resolve();
    }
    payload.access_key = key;
    payload.subject = 'New Bulktown meal plan sign-up';
    payload.from_name = 'Bulktown website';
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function () {}, function () {});
  }

  document.addEventListener('submit', function (event) {
    if (event.target.id !== 'plan-unlock') return;
    event.preventDefault();
    var email = $('plan-email');
    var value = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      email.setAttribute('aria-invalid', 'true');
      $('plan-email-error').textContent = value ? 'That email doesn\'t look right. Check it and try again.' : 'Enter your email to unlock your week.';
      email.focus();
      return;
    }
    var unlock = function () {
      plan.unlocked = true;
      renderPlan(true);
    };
    // The hidden "company" box is only ever filled by bots, and the same email is never sent twice.
    if ($('plan-company').value || plan.sentFor === value) { unlock(); return; }
    plan.sentFor = value;
    var button = $('plan-submit');
    button.disabled = true;
    button.textContent = 'Unlocking…';
    sendSignup({
      email: value,
      goal: plan.goal,
      workouts_per_week: plan.workouts,
      trained_today: plan.today,
      marketing_opt_in: $('plan-optin').checked ? 'Yes' : 'No'
    }).then(unlock);
  });

  document.addEventListener('input', function (event) {
    if (event.target.id !== 'plan-email') return;
    event.target.removeAttribute('aria-invalid');
    $('plan-email-error').textContent = '';
  });

  /* ---------- Page ---------- */

  function render(focusKey) {
    renderGoal();
    renderMenu();
    // The first question highlights the goal picked at the top of the page.
    if (plan.step === 1) renderPlan();
    save();
    // Re-drawing replaces the button that was just pressed, so put focus back on its replacement.
    if (focusKey) {
      var next = document.querySelector('[data-key="' + focusKey + '"]');
      if (next) next.focus();
    }
  }

  document.addEventListener('click', function (event) {
    var el = event.target.closest ? event.target.closest('button') : null;
    if (!el) return;

    // Meal plan steps
    if (el.hasAttribute('data-plan-goal')) {
      plan.goal = el.getAttribute('data-plan-goal');
      state.goal = plan.goal; // one goal across the whole page
      plan.step = 2;
      renderGoal(); renderMenu(); save();
      renderPlan(true);
      return;
    }
    if (el.hasAttribute('data-plan-workouts')) {
      plan.workouts = Number(el.getAttribute('data-plan-workouts'));
      plan.step = 3;
      renderPlan(true);
      return;
    }
    if (el.hasAttribute('data-plan-today')) {
      plan.today = el.getAttribute('data-plan-today');
      plan.step = 4;
      renderPlan(true);
      return;
    }
    if (el.hasAttribute('data-plan-back')) {
      plan.step = Math.max(1, plan.step - 1);
      renderPlan(true);
      return;
    }
    if (el.hasAttribute('data-plan-restart')) {
      plan.step = 1;
      renderPlan(true);
      return;
    }
    if (el.hasAttribute('data-print')) {
      window.print();
      return;
    }

    // Goal picker, menu filter and protein add-ons
    var key = el.getAttribute('data-key');
    if (el.hasAttribute('data-goal')) {
      var goal = el.getAttribute('data-goal');
      state.goal = state.goal === goal ? 'all' : goal;
    } else if (el.hasAttribute('data-filter')) {
      state.goal = el.getAttribute('data-filter');
    } else if (el.hasAttribute('data-addon')) {
      var addonId = el.getAttribute('data-addon');
      state.addons[addonId] = !state.addons[addonId];
    } else {
      return;
    }
    render(key);
  });

  // Respect "reduce motion": hold the background video on its poster frame.
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var video = document.querySelector('.hero-media');
      if (video) { video.removeAttribute('autoplay'); video.pause(); }
    }
  } catch (e) { /* leave the video as it is */ }

  render();
  renderPlan();
})();
