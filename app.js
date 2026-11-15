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
      '<p class="label-note">Per serving. Every dish on the menu gets a label like this.</p>';
  }

  /* ---------- Menu ---------- */

  function renderMenu() {
    var goal = state.goal;
    var shown = MENU.filter(function (d) { return goal === 'all' || d.goal === goal; });

    $('menu-summary').textContent = goal === 'all'
      ? 'Showing all ' + shown.length + ' dishes.'
      : 'Showing ' + shown.length + ' ' + (goal === 'bulk' ? 'bulking' : 'cutting') + ' dishes.';

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
      ? 'Add dishes to start counting.'
      : total.p >= target
        ? 'Target hit. ' + total.p + 'g protein today.'
        : (target - total.p) + 'g protein to go.';

    $('tray-body').innerHTML = !rows.length
      ? '<p class="tray-empty">Nothing here yet. Tap "Add to my day" on any dish and your calories and protein add up here.</p>'
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

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var LOCK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var plan = { unlocked: false, goalTouched: false, targetTouched: false };

  function planInputs() {
    var cut = $('plan-goal-cut');
    var target = Number($('plan-target').value);
    if (!(target >= 60)) target = 60;
    if (target > 300) target = 300;
    return {
      goal: cut && cut.checked ? 'cut' : 'bulk',
      meals: Math.max(1, Math.min(3, Number($('plan-meals').value) || 2)),
      target: target
    };
  }

  // Five days from the dishes that match the goal. Each day rotates through the
  // dishes, then switches on protein add-ons (biggest first) until the target is met.
  function buildPlan(goal, meals, target) {
    var pool = MENU.filter(function (d) { return d.goal === goal; });
    if (!pool.length) return [];
    return DAYS.map(function (day, i) {
      var picks = [];
      for (var k = 0; k < meals; k++) picks.push({ dish: pool[(i + k) % pool.length], on: false });
      var protein = picks.reduce(function (sum, x) { return sum + x.dish.p; }, 0);
      picks.filter(function (x) { return ADDONS[x.dish.addon]; })
        .sort(function (a, b) { return ADDONS[b.dish.addon].p - ADDONS[a.dish.addon].p; })
        .forEach(function (x) {
          if (protein >= target) return;
          x.on = true;
          protein += ADDONS[x.dish.addon].p;
        });
      var kcal = 0;
      var rows = picks.map(function (x) {
        var extra = x.on ? ADDONS[x.dish.addon] : null;
        var k2 = x.dish.kcal + (extra ? extra.kcal : 0);
        var p2 = x.dish.p + (extra ? extra.p : 0);
        kcal += k2;
        return { name: x.dish.name + (extra ? ' + ' + extra.short : ''), kcal: k2, p: p2 };
      });
      return { day: day, rows: rows, kcal: kcal, p: protein, gap: Math.max(0, target - protein) };
    });
  }

  function renderPlan() {
    var out = $('plan-output');
    if (!out) return;
    var input = planInputs();
    var days = buildPlan(input.goal, input.meals, input.target);

    var cards = days.map(function (d, i) {
      if (!plan.unlocked && i > 0) {
        return '<div class="day day--locked"><h4>' + d.day.toUpperCase() + '</h4><p>' + LOCK + 'Unlocks with your email</p></div>';
      }
      return '<div class="day"><h4>' + d.day.toUpperCase() + '</h4>' +
        '<ul class="day-meals">' + d.rows.map(function (r) {
          return '<li><span class="day-meal-name">' + esc(r.name) + '</span><span class="day-meal-line">' + r.kcal + ' kcal · ' + r.p + 'g protein</span></li>';
        }).join('') + '</ul>' +
        '<div class="day-total"><span>' + d.kcal + ' kcal</span><span>' + d.p + 'g protein</span></div>' +
        '<p class="day-note">' + (d.gap > 0 ? d.gap + 'g of protein left to get from your other meals.' : 'Protein target met.') + '</p>' +
        '</div>';
    }).join('');

    var goalWord = input.goal === 'bulk' ? 'bulking' : 'cutting';
    var summary = 'Five days of ' + goalWord + ', ' + input.meals + (input.meals === 1 ? ' meal' : ' meals') + ' a day, aiming for ' + input.target + 'g protein.';
    out.innerHTML =
      '<div class="plan-output-head"><div>' +
        '<h3 id="plan-heading" tabindex="-1">' + (plan.unlocked ? 'YOUR BULKTOWN WEEK' : 'A TASTE OF YOUR PLAN') + '</h3>' +
        '<p>' + (plan.unlocked ? summary : 'Monday is on us. Enter your email for the full week.') + '</p></div>' +
        (plan.unlocked ? '<button type="button" class="plan-print" data-print>Print or save as PDF</button>' : '') +
      '</div>' +
      '<div class="plan-days">' + cards + '</div>' +
      (plan.unlocked ? '<p class="plan-foot">This covers your Bulktown meals, not everything you eat in a day. How much you need depends on your size and training.</p>' : '');
  }

  // Until the visitor edits the plan form, it follows the goal and target they picked above.
  function syncPlanForm() {
    if (!$('plan-form')) return;
    if (!plan.goalTouched && state.goal !== 'all') {
      $('plan-goal-bulk').checked = state.goal === 'bulk';
      $('plan-goal-cut').checked = state.goal === 'cut';
    }
    if (!plan.targetTouched) $('plan-target').value = state.target;
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
      if (event.target.id === 'plan-target') plan.targetTouched = true;
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
        $('plan-email-error').textContent = value ? 'That email doesn\'t look right. Check it and try again.' : 'Enter your email to get your plan.';
        email.focus();
        return;
      }
      var unlock = function () {
        plan.unlocked = true;
        button.disabled = false;
        button.textContent = 'Update my plan';
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
      button.textContent = 'Building your plan…';
      sendSignup({
        email: value,
        goal: input.goal,
        meals_per_day: input.meals,
        protein_target: input.target + 'g',
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
