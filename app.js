/* Bulktown — goal picker, menu and "Your day" tracker. Menu data lives in menu.js. */
(function () {
  'use strict';

  var MENU = window.BULKTOWN_MENU || [];
  var ADDONS = window.BULKTOWN_ADDONS || {};
  var HERO_DISH = window.BULKTOWN_HERO_DISH || {};
  var STORE_KEY = 'bulktown-day';

  var state = { goal: 'all', tray: {}, addons: {}, target: 150 };

  // Remember the visitor's goal and day between visits. Storage can be
  // unavailable (private mode, blocked cookies), so every use is guarded.
  try {
    var saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (saved.goal === 'bulk' || saved.goal === 'cut') state.goal = saved.goal;
      if (saved.tray && typeof saved.tray === 'object') state.tray = saved.tray;
      if (saved.addons && typeof saved.addons === 'object') state.addons = saved.addons;
      if (Number(saved.target) >= 60 && Number(saved.target) <= 300) state.target = Number(saved.target);
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

  // A dish's numbers, including its protein add-on when switched on.
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

  var ARROW_UP = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  var ARROW_DOWN = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';

  function tag(goal, extraClass) {
    var cls = 'tag tag--' + goal + (extraClass ? ' ' + extraClass : '');
    return goal === 'bulk'
      ? '<span class="' + cls + '">' + ARROW_UP + 'BULK</span>'
      : '<span class="' + cls + '">' + ARROW_DOWN + 'CUT</span>';
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
      var qty = state.tray[d.id] || 0;
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
          '<button type="button" class="add-btn" data-add="' + id + '" data-key="add-' + id + '">' +
            (qty > 0 ? 'Add another (' + qty + ' in my day)' : 'Add to my day') + '</button>' +
        '</div></article>';
    }).join('');
  }

  /* ---------- Your day ---------- */

  function renderTray() {
    var total = { kcal: 0, p: 0, c: 0, f: 0 };
    var rows = [];

    MENU.forEach(function (d) {
      var qty = state.tray[d.id] || 0;
      if (qty <= 0) return;
      var m = macros(d);
      total.kcal += m.kcal * qty; total.p += m.p * qty; total.c += m.c * qty; total.f += m.f * qty;
      var id = esc(d.id);
      rows.push('<li>' +
        '<div><span class="tray-item-name">' + esc(d.name + (m.on ? ' + ' + m.extra.short : '')) + '</span>' +
        '<span class="tray-item-line">' + (m.kcal * qty) + ' kcal · ' + (m.p * qty) + 'g protein</span></div>' +
        '<div class="tray-qty">' +
          '<button type="button" class="round-btn" data-qty="' + id + '" data-delta="-1" data-key="less-' + id + '" aria-label="Remove one ' + esc(d.name) + '">−</button>' +
          '<span>' + qty + '</span>' +
          '<button type="button" class="round-btn" data-qty="' + id + '" data-delta="1" data-key="more-' + id + '" aria-label="Add one more ' + esc(d.name) + '">+</button>' +
        '</div></li>');
    });

    var target = state.target;
    var pct = Math.min(100, Math.round((total.p / target) * 100));
    $('target-value').textContent = target + 'g';
    $('progress').setAttribute('aria-label', total.p + ' of ' + target + ' grams of protein');
    $('progress-fill').style.width = pct + '%';
    $('progress-line').textContent = !rows.length
      ? 'Add meals to start counting.'
      : total.p >= target
        ? 'Target hit. ' + total.p + 'g protein today.'
        : (target - total.p) + 'g protein to go.';

    $('tray-body').innerHTML = !rows.length
      ? '<p class="tray-empty">Nothing here yet. Tap "Add to my day" on any meal and your calories and protein add up here.</p>'
      : '<ul class="tray-list">' + rows.join('') + '</ul>' +
        '<dl class="tray-totals">' +
          '<div class="big"><dt>Calories</dt><dd>' + total.kcal + '</dd></div>' +
          '<div class="big protein"><dt>Protein</dt><dd>' + total.p + 'g</dd></div>' +
          '<div><dt>Carbs</dt><dd>' + total.c + 'g</dd></div>' +
          '<div><dt>Fat</dt><dd>' + total.f + 'g</dd></div>' +
        '</dl>' +
        '<div class="tray-actions">' +
          '<a class="btn btn--accent" href="#order">Order my day</a>' +
          '<button type="button" class="link-btn" data-clear data-key="clear">Clear and start again</button>' +
        '</div>';
  }

  /* ---------- Meal plan ---------- */

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var LOCK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var plan = { unlocked: false, goalTouched: false, sentFor: '' };

  // Which of the next seven days are training days (T) or rest days (R),
  // starting today, for 1 to 7 workouts a week.
  var WEEK_SHAPES = { 1: 'TRRRRRR', 2: 'TRRTRRR', 3: 'TRTRTRR', 4: 'TTRTTRR', 5: 'TTTRTTR', 6: 'TTTTTTR', 7: 'TTTTTTT' };

  // What each kind of day asks for. `score` ranks the meals for that day (highest wins).
  var SESSIONS = {
    legs: { label: 'Legs day', score: function (d) { return d.c; }, why: 'Legs is the biggest session going, so refuel with carbs.' },
    full: { label: 'Full-body day', score: function (d) { return d.c; }, why: 'A full-body session uses everything, so refuel with carbs.' },
    upper: { label: 'Upper body day', score: function (d) { return d.p; }, why: 'Upper body day is about repair, so protein comes first.' },
    cardio: { label: 'Cardio day', score: function (d) { return d.c; }, why: 'Cardio runs your energy down, so top your carbs back up.' },
    train: { label: 'Training day', score: function (d) { return d.p + d.c / 2; }, why: 'Training day, so a solid mix of carbs and protein.' },
    rest: { label: 'Rest day', score: function (d) { return d.p - d.c / 2; }, why: 'Rest day, so go lower on carbs and keep the protein up.' }
  };

  function checkedValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function planInputs() {
    var workouts = Number(checkedValue('plan-workouts'));
    var today = checkedValue('plan-today');
    return {
      goal: checkedValue('plan-goal') === 'cut' ? 'cut' : 'bulk',
      workouts: WEEK_SHAPES[workouts] ? workouts : 4,
      today: SESSIONS[today] && today !== 'train' ? today : 'legs'
    };
  }

  // Seven days starting today. Today's meal answers today's session; the days
  // after are training or rest days spread to match the workouts a week.
  // The same meal is never suggested two days running, and training days
  // come with the meal's protein add-on.
  function buildPlan(goal, workouts, today) {
    var pool = MENU.filter(function (d) { return d.goal === goal; });
    if (!pool.length) return [];
    var shape = WEEK_SHAPES[workouts];
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

  function renderPlan() {
    var out = $('plan-output');
    if (!out) return;
    var input = planInputs();
    var days = buildPlan(input.goal, input.workouts, input.today);

    var cards = days.map(function (d, i) {
      var head = '<p class="day-when">' + esc(d.when.toUpperCase()) + '</p><h4>' + esc(d.label.toUpperCase()) + '</h4>';
      if (!plan.unlocked && i > 0) {
        return '<div class="day day--locked">' + head + '<p class="day-lock">' + LOCK + 'Unlocks with your email</p></div>';
      }
      var meal =
        '<p class="day-why">' + esc(d.why) + '</p>' +
        '<div class="day-meal"><span class="day-eat">' + (i === 0 ? 'Eat this' : 'Get this') + '</span>' +
          '<span class="day-meal-name">' + esc(d.dish.name) + '</span>' +
          '<span class="day-meal-line">' + d.kcal + ' kcal · ' + d.p + 'g protein</span>' +
          (d.extra ? '<span class="day-extra">With ' + esc(d.extra.short) + ' for ' + d.extra.p + 'g more protein.</span>' : '') +
        '</div>';
      if (i === 0) {
        return '<div class="day day--today">' +
          '<img class="day-photo" src="' + esc(d.dish.img) + '" alt="' + esc(d.dish.alt || '') + '" style="object-position: ' + esc(d.dish.pos || 'center') + '">' +
          '<div class="day-body">' + head + meal + '</div></div>';
      }
      return '<div class="day">' + head + meal + '</div>';
    }).join('');

    var training = days.filter(function (d) { return d.training; }).length;
    var summary = (input.goal === 'bulk' ? 'Bulking' : 'Cutting') + ', with ' + training + ' training ' + (training === 1 ? 'day' : 'days') +
      ' and ' + (7 - training) + ' rest ' + (7 - training === 1 ? 'day' : 'days') + ' this week.';
    out.innerHTML =
      '<div class="plan-output-head"><div>' +
        '<h3 id="plan-heading" tabindex="-1">' + (plan.unlocked ? 'YOUR BULKTOWN WEEK' : 'EAT THIS TODAY') + '</h3>' +
        '<p>' + (plan.unlocked ? summary : 'Tomorrow and the rest of your week unlock with your email.') + '</p></div>' +
        (plan.unlocked ? '<button type="button" class="plan-print" data-print>Print or save as PDF</button>' : '') +
      '</div>' +
      '<div class="plan-days">' + cards + '</div>' +
      (plan.unlocked ? '<p class="plan-foot">This is your Bulktown meal for each day, not everything you eat. How much you need depends on your size and training. Change your answers and the week updates.</p>' : '');
  }

  // Until the visitor picks a goal in the plan form, it follows the goal they chose at the top.
  function syncPlanForm() {
    if (!$('plan-form')) return;
    if (!plan.goalTouched && state.goal !== 'all') {
      $('plan-goal-bulk').checked = state.goal === 'bulk';
      $('plan-goal-cut').checked = state.goal === 'cut';
    }
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

  var planForm = $('plan-form');
  if (planForm) {
    planForm.addEventListener('change', function (event) {
      if (event.target.name === 'plan-goal') plan.goalTouched = true;
      renderPlan();
    });
    $('plan-email').addEventListener('input', function () {
      $('plan-email').removeAttribute('aria-invalid');
      $('plan-email-error').textContent = '';
    });
    planForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = $('plan-email');
      var value = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        email.setAttribute('aria-invalid', 'true');
        $('plan-email-error').textContent = value ? 'That email doesn\'t look right. Check it and try again.' : 'Enter your email to get your week.';
        email.focus();
        return;
      }
      var unlock = function () {
        plan.unlocked = true;
        button.disabled = false;
        button.textContent = 'Update my week';
        renderPlan();
        var heading = $('plan-heading');
        if (heading) heading.focus();
      };
      var button = $('plan-submit');
      if ($('plan-company').value) { unlock(); return; } // filled only by bots
      var input = planInputs();
      // The same email submitting again only refreshes the plan, it isn't sent twice.
      if (plan.sentFor === value) { unlock(); return; }
      plan.sentFor = value;
      button.disabled = true;
      button.textContent = 'Building your week…';
      sendSignup({
        email: value,
        goal: input.goal,
        workouts_per_week: input.workouts,
        trained_today: input.today,
        marketing_opt_in: $('plan-optin').checked ? 'Yes' : 'No'
      }).then(unlock);
    });
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest && event.target.closest('[data-print]')) window.print();
  });

  function render(focusKey) {
    renderGoal();
    renderMenu();
    renderTray();
    syncPlanForm();
    renderPlan();
    save();
    // Re-drawing replaces the button that was just pressed, so put focus back on its replacement.
    if (focusKey) {
      var next = document.querySelector('[data-key="' + focusKey + '"]');
      if (next) next.focus();
    }
  }

  function setQty(id, qty) {
    if (qty <= 0) { delete state.tray[id]; } else { state.tray[id] = qty; }
  }

  document.addEventListener('click', function (event) {
    var el = event.target.closest('button');
    if (!el) return;
    var key = el.getAttribute('data-key');

    if (el.hasAttribute('data-goal')) {
      var goal = el.getAttribute('data-goal');
      state.goal = state.goal === goal ? 'all' : goal;
    } else if (el.hasAttribute('data-filter')) {
      state.goal = el.getAttribute('data-filter');
    } else if (el.hasAttribute('data-addon')) {
      var addonId = el.getAttribute('data-addon');
      state.addons[addonId] = !state.addons[addonId];
    } else if (el.hasAttribute('data-add')) {
      var addId = el.getAttribute('data-add');
      setQty(addId, (state.tray[addId] || 0) + 1);
    } else if (el.hasAttribute('data-qty')) {
      var qtyId = el.getAttribute('data-qty');
      setQty(qtyId, (state.tray[qtyId] || 0) + Number(el.getAttribute('data-delta')));
    } else if (el.hasAttribute('data-target')) {
      state.target = Math.max(60, Math.min(300, state.target + Number(el.getAttribute('data-target'))));
    } else if (el.hasAttribute('data-clear')) {
      state.tray = {};
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
})();
