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

  /* ---------- Motion ---------- */

  var EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  var SPRING = 'cubic-bezier(0.3, 1.5, 0.5, 1)';
  var booted = false; // nothing animates while the page is first drawn

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  // Animate only after the first draw, in browsers that can, for people who haven't asked for less motion.
  function canAnimate(el) {
    return booted && !!el && typeof el.animate === 'function' && !reducedMotion();
  }

  // A quick press-and-release bounce on the thing that was tapped.
  function pop(el) {
    if (canAnimate(el)) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' });
  }

  // Elements rise into place one after another.
  function stagger(nodes, gap, start) {
    Array.prototype.forEach.call(nodes, function (node, i) {
      if (canAnimate(node)) {
        node.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
          { duration: 380, delay: (start || 0) + gap * i, easing: EASE, fill: 'backwards' });
      }
    });
  }

  // Count a number on the page from its current value to a new one.
  function tween(el, to) {
    if (!el) return;
    var from = parseInt(el.textContent, 10);
    if (el._frame) window.cancelAnimationFrame(el._frame);
    if (!canAnimate(el) || isNaN(from) || from === to || !window.requestAnimationFrame) { el.textContent = to; return; }
    var started = null;
    var step = function (now) {
      if (started === null) started = now;
      var t = Math.min(1, (now - started) / 450);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      el._frame = t < 1 ? window.requestAnimationFrame(step) : null;
    };
    el._frame = window.requestAnimationFrame(step);
  }

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

    var line = goal === 'bulk'
      ? 'Bulking it is. The menu now shows the bigger plates with more carbs and calories.'
      : goal === 'cut'
        ? 'Cutting it is. The menu now shows the lighter plates that keep protein high.'
        : 'Tap one and the whole menu shapes itself around you.';
    var goalLine = $('goal-line');
    if (goalLine.textContent !== line) {
      goalLine.textContent = line;
      stagger([goalLine], 0, 0);
    }
    $('menu-cta').textContent = goal === 'bulk' ? 'See the bulking menu' : goal === 'cut' ? 'See the cutting menu' : 'See the full menu';

    var dish = dishById(HERO_DISH[goal]) || MENU[0];
    var label = $('hero-label');
    if (!dish || !label || dish.id === heroDishId) return;
    heroDishId = dish.id;
    if (!canAnimate(label)) { fillLabel(label, dish); return; }
    // Swap the example label like a card being dealt: the old one drops away, the new one lands.
    var out = label.animate([{ opacity: 1, transform: 'rotate(-2deg)' }, { opacity: 0, transform: 'rotate(-8deg) translateY(24px) scale(0.94)' }],
      { duration: 160, easing: 'ease-in' });
    out.onfinish = function () {
      fillLabel(label, dishById(heroDishId) || dish);
      label.animate([{ opacity: 0, transform: 'rotate(4deg) translateY(-28px) scale(1.05)' }, { opacity: 1, transform: 'rotate(-2deg)' }],
        { duration: 400, easing: SPRING });
    };
  }

  var heroDishId = null;

  function fillLabel(label, dish) {
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

  // How a meal's calories split between protein, carbs and fat, in whole percent.
  function share(m) {
    var pk = m.p * 4, ck = m.c * 4, fk = m.f * 9, total = pk + ck + fk || 1;
    var p = Math.round((pk / total) * 100);
    var c = Math.round((ck / total) * 100);
    return { p: p, c: c, f: 100 - p - c };
  }

  function shareLabel(s) {
    return 'Share of calories: protein ' + s.p + '%, carbs ' + s.c + '%, fat ' + s.f + '%';
  }

  function cardHtml(d) {
    var m = macros(d);
    var s = share(m);
    var id = esc(d.id);
    var addon = m.extra
      ? '<button type="button" class="addon" data-addon="' + id + '" aria-pressed="' + (m.on ? 'true' : 'false') + '">' +
          '<span data-k="addon">' + esc(m.on ? m.extra.on : m.extra.off) + '</span><span>+' + m.extra.p + 'g protein</span></button>'
      : '';
    return '<article class="dish" data-id="' + id + '" data-goal="' + esc(d.goal) + '">' +
      '<img class="dish-photo" src="' + esc(d.img) + '" alt="' + esc(d.alt || '') + '" loading="lazy" style="object-position: ' + esc(d.pos || 'center') + '">' +
      '<div class="dish-body">' +
        '<div class="dish-top">' + tag(d.goal) + (d.price ? '<span class="dish-price">' + esc(d.price) + '</span>' : '') + '</div>' +
        '<div><h3>' + esc(d.name) + '</h3><p class="dish-desc">' + esc(d.desc) + '</p></div>' +
        '<div class="dish-kcal"><strong data-k="kcal">' + m.kcal + '</strong> kcal</div>' +
        '<div class="macro-bar" role="img" aria-label="' + shareLabel(s) + '">' +
          '<div class="p" style="width:' + s.p + '%"></div><div class="c" style="width:' + s.c + '%"></div><div class="f" style="width:' + s.f + '%"></div>' +
        '</div>' +
        '<dl class="macros">' +
          '<div class="p"><dt>Protein</dt><dd><span data-k="p">' + m.p + '</span>g</dd></div>' +
          '<div class="c"><dt>Carbs</dt><dd><span data-k="c">' + m.c + '</span>g</dd></div>' +
          '<div class="f"><dt>Fat</dt><dd><span data-k="f">' + m.f + '</span>g</dd></div>' +
        '</dl>' +
        addon +
      '</div></article>';
  }

  // Every meal is drawn once. Filtering shows and hides cards; it never redraws them.
  function buildMenu() {
    $('menu-grid').innerHTML = MENU.map(cardHtml).join('');
    applyFilter(false);
  }

  // Switching a protein add-on: the numbers count to their new values and the bar slides.
  function updateCard(id) {
    var d = dishById(id);
    var card = document.querySelector('.dish[data-id="' + id + '"]');
    if (!d || !card) return;
    var m = macros(d);
    var s = share(m);
    ['kcal', 'p', 'c', 'f'].forEach(function (k) { tween(card.querySelector('[data-k="' + k + '"]'), m[k]); });
    var bar = card.querySelector('.macro-bar');
    bar.setAttribute('aria-label', shareLabel(s));
    bar.querySelector('.p').style.width = s.p + '%';
    bar.querySelector('.c').style.width = s.c + '%';
    bar.querySelector('.f').style.width = s.f + '%';
    var button = card.querySelector('.addon');
    if (button) {
      button.setAttribute('aria-pressed', m.on ? 'true' : 'false');
      button.querySelector('[data-k="addon"]').textContent = m.on ? m.extra.on : m.extra.off;
    }
  }

  var filterRun = 0;

  // Show the meals for the current goal. When animated: cards that no longer fit
  // fade out, the ones that stay glide to their new places, and new ones rise in.
  function applyFilter(animated) {
    var goal = state.goal;
    var grid = $('menu-grid');
    var cards = Array.prototype.slice.call(grid.children).filter(function (c) { return c.classList && c.classList.contains('dish'); });
    var fits = function (c) { return state.goal === 'all' || c.getAttribute('data-goal') === state.goal; };
    var count = cards.filter(fits).length;

    $('menu-summary').textContent = goal === 'all'
      ? 'Showing all ' + count + ' meals.'
      : 'Showing ' + count + ' ' + (goal === 'bulk' ? 'bulking' : 'cutting') + ' meals.';

    if (!animated || !canAnimate(grid)) {
      cards.forEach(function (c) { c.hidden = !fits(c); });
      return;
    }

    var run = ++filterRun;
    // Positions are measured against the grid, so the page scrolling mid-move doesn't throw them off.
    var place = function (c) {
      var g = grid.getBoundingClientRect(), r = c.getBoundingClientRect();
      return { left: r.left - g.left, top: r.top - g.top };
    };
    var before = [];
    cards.forEach(function (c) { if (!c.hidden) before.push({ card: c, box: place(c) }); });
    var leaving = before.filter(function (b) { return !fits(b.card); });

    var settle = function () {
      if (run !== filterRun) return; // a newer tap has taken over
      cards.forEach(function (c) { c.hidden = !fits(c); });
      var entering = 0;
      cards.forEach(function (c) {
        if (c.hidden) return;
        var was = null;
        for (var i = 0; i < before.length; i++) { if (before[i].card === c) was = before[i].box; }
        if (was) {
          var now = place(c);
          var dx = was.left - now.left, dy = was.top - now.top;
          if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 460, easing: EASE });
        } else {
          c.animate([{ opacity: 0, transform: 'translateY(28px) scale(0.96)' }, { opacity: 1, transform: 'none' }],
            { duration: 420, delay: 70 * entering + 60, easing: EASE, fill: 'backwards' });
          entering++;
        }
      });
    };

    if (!leaving.length) { settle(); return; }
    var left = leaving.length;
    leaving.forEach(function (b) {
      var out = b.card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.92)' }], { duration: 190, easing: 'ease-in', fill: 'forwards' });
      out.onfinish = function () {
        out.cancel(); // the card is hidden next, so drop the held end state
        if (--left === 0) settle();
      };
    });
  }

  /* ---------- Meal plan: four questions, then the answer ---------- */

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var LOCK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var QUESTIONS = 4;

  // step 1 = goal, 2 = kind of training, 3 = sessions a week, 4 = today's session, 5 = the answer
  var plan = { step: 1, goal: '', training: '', sessions: 0, today: '', unlocked: false, sentFor: '', busy: false };

  // Which of the next seven days are training days (T) or rest days (R),
  // starting today, for 1 to 7 sessions a week.
  var WEEK_SHAPES = { 1: 'TRRRRRR', 2: 'TRRTRRR', 3: 'TRTRTRR', 4: 'TTRTTRR', 5: 'TTTRTTR', 6: 'TTTTTTR', 7: 'TTTTTTT' };

  // What a day's meal should lead with. Each one ranks the meals (highest score wins).
  var LEADS = {
    carbs: function (d) { return d.c; },                 // refuel after the big, draining sessions
    protein: function (d) { return d.p; },               // repair after strength work
    mix: function (d) { return d.p + d.c / 2; },         // a balanced training day
    fuel: function (d) { return d.c + d.p / 2; },        // a carb-leaning training day
    light: function (d) { return d.p - d.c / 2; }        // rest and easy days: fewer carbs, protein up
  };

  // Every session someone can say they did today.
  //   lead  = what the meal leads with (see LEADS)
  //   extra = whether to add the meal's protein add-on
  var SESSIONS = {
    legs: { title: 'LEGS', sub: 'Squats, deadlifts, lunges', label: 'Legs day', chip: 'Legs today', head: 'YOU TRAINED LEGS. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'Legs is the biggest session going, so refuel with carbs.' },
    upper: { title: 'UPPER BODY', sub: 'Push, pull, arms', label: 'Upper body day', chip: 'Upper body today', head: 'YOU TRAINED UPPER BODY. NOW EAT THIS.', lead: 'protein', extra: true, why: 'Upper body day is about repair, so protein comes first.' },
    full: { title: 'FULL BODY', sub: 'A bit of everything', label: 'Full-body day', chip: 'Full body today', head: 'YOU TRAINED FULL BODY. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'A full-body session uses everything, so refuel with carbs.' },

    easy: { title: 'EASY RUN', sub: 'Steady and comfortable', label: 'Easy run day', chip: 'Easy run today', head: 'YOU DID AN EASY RUN. NOW EAT THIS.', lead: 'mix', extra: true, why: 'An easy run wants a steady mix of carbs and protein.' },
    long: { title: 'LONG RUN', sub: 'An hour or more', label: 'Long run day', chip: 'Long run today', head: 'YOU DID A LONG RUN. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'A long run empties the tank, so carbs come first.' },
    speed: { title: 'SPEED SESSION', sub: 'Intervals, hills, tempo', label: 'Speed day', chip: 'Speed session today', head: 'YOU DID A SPEED SESSION. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'Hard efforts burn through carbs fast, so top them back up.' },

    practice: { title: 'TRAINING', sub: 'Drills and practice', label: 'Training day', chip: 'Training today', head: 'YOU TRAINED. NOW EAT THIS.', lead: 'mix', extra: true, why: 'Training day, so a solid mix of carbs and protein.' },
    match: { title: 'MATCH DAY', sub: 'Game or competition', label: 'Match day', chip: 'Match today', head: 'IT WAS MATCH DAY. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'Match day takes the most out of you, so carbs come first.' },

    hiit: { title: 'HIIT', sub: 'Hard and fast', label: 'HIIT day', chip: 'HIIT today', head: 'YOU DID HIIT. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'HIIT burns through carbs fast, so top them back up.' },
    strength: { title: 'STRENGTH CLASS', sub: 'Weights and circuits', label: 'Strength day', chip: 'Strength class today', head: 'YOU DID A STRENGTH CLASS. NOW EAT THIS.', lead: 'protein', extra: true, why: 'Strength work is about repair, so protein comes first.' },
    slow: { title: 'YOGA OR PILATES', sub: 'Slow and controlled', label: 'Light day', chip: 'Yoga or Pilates today', head: 'YOU KEPT IT LIGHT. NOW EAT THIS.', lead: 'light', extra: false, why: 'A lighter session, so go easy on carbs and keep the protein up.' },

    weights: { title: 'WEIGHTS', sub: 'Lifting and strength work', label: 'Weights day', chip: 'Weights today', head: 'YOU LIFTED. NOW EAT THIS.', lead: 'protein', extra: true, why: 'Lifting is about repair, so protein comes first.' },
    cardio: { title: 'CARDIO', sub: 'Run, ride, swim', label: 'Cardio day', chip: 'Cardio today', head: 'YOU DID CARDIO. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'Cardio runs your energy down, so top your carbs back up.' },
    sport: { title: 'SPORT', sub: 'Match or practice', label: 'Sport day', chip: 'Sport today', head: 'YOU PLAYED. NOW EAT THIS.', lead: 'carbs', extra: true, why: 'Sport is stop-start and hard on the legs, so refuel with carbs.' },
    session: { title: 'A CLASS', sub: 'HIIT, spin, circuits', label: 'Class day', chip: 'Class today', head: 'YOU DID A CLASS. NOW EAT THIS.', lead: 'fuel', extra: true, why: 'A hard class burns through carbs, so top them back up.' },

    rest: { title: 'REST DAY', sub: 'Nothing today', label: 'Rest day', chip: 'Rest day today', head: 'IT\'S A REST DAY. EAT THIS.', lead: 'light', extra: false, why: 'Rest day, so go lower on carbs and keep the protein up.' }
  };

  // The kinds of training someone can pick, the sessions offered for "today",
  // and what an ordinary training day later in the week looks like for them.
  var TRAINING = {
    weights: { title: 'WEIGHTS', sub: 'Lifting and strength work', chip: 'Weights', today: ['legs', 'upper', 'full', 'rest'],
      next: { label: 'Gym day', lead: 'mix', why: 'Gym day, so protein to rebuild and carbs to fuel it.' } },
    running: { title: 'RUNNING', sub: 'Runs, rides and swims', chip: 'Running', today: ['easy', 'long', 'speed', 'rest'],
      next: { label: 'Run day', lead: 'fuel', why: 'Run day, so carbs first with protein to recover.' } },
    sport: { title: 'SPORT', sub: 'Football, rugby, tennis, boxing', chip: 'Sport', today: ['practice', 'match', 'rest'],
      next: { label: 'Training day', lead: 'mix', why: 'Training day, so a solid mix of carbs and protein.' } },
    classes: { title: 'CLASSES', sub: 'HIIT, CrossFit, spin, yoga', chip: 'Classes', today: ['hiit', 'strength', 'slow', 'rest'],
      next: { label: 'Class day', lead: 'fuel', why: 'Class day, so carbs to keep up with protein to recover.' } },
    mix: { title: 'A MIX', sub: 'A bit of everything', chip: 'A mix', today: ['weights', 'cardio', 'sport', 'session', 'rest'],
      next: { label: 'Training day', lead: 'mix', why: 'Training day, so a solid mix of carbs and protein.' } }
  };
  var TRAINING_ORDER = ['weights', 'running', 'sport', 'classes', 'mix'];

  // Seven days starting today. Today's meal answers today's session; the days
  // after are training or rest days spread to match the sessions a week, with
  // training days shaped by the kind of training. The same meal is never
  // suggested two days running.
  function buildPlan(goal, training, sessions, today) {
    var pool = MENU.filter(function (d) { return d.goal === goal; });
    var kind = TRAINING[training];
    if (!pool.length || !kind || !SESSIONS[today]) return [];
    var shape = WEEK_SHAPES[sessions] || WEEK_SHAPES[4];
    var days = [SESSIONS[today]];
    for (var i = 1; i < 7; i++) {
      // If today is a rest day, the week's sessions start tomorrow.
      var slot = today === 'rest' ? shape.charAt(i - 1) : shape.charAt(i);
      days.push(slot === 'T' ? { label: kind.next.label, lead: kind.next.lead, why: kind.next.why, extra: true } : SESSIONS.rest);
    }
    var todayIndex = new Date().getDay();
    var previous = null;
    return days.map(function (day, n) {
      var score = LEADS[day.lead];
      var choices = pool.filter(function (d) { return pool.length === 1 || d !== previous; });
      var dish = choices.reduce(function (best, d) { return score(d) > score(best) ? d : best; });
      previous = dish;
      var extra = day.extra ? ADDONS[dish.addon] : null;
      var weekday = WEEKDAYS[(todayIndex + n) % 7];
      return {
        when: n === 0 ? 'Today · ' + weekday : n === 1 ? 'Tomorrow · ' + weekday : weekday,
        label: day.label,
        why: day.why,
        dish: dish,
        extra: extra || null,
        kcal: dish.kcal + (extra ? extra.kcal : 0),
        p: dish.p + (extra ? extra.p : 0),
        training: day !== SESSIONS.rest
      };
    });
  }

  function planTop(step, grow) {
    var bars = '';
    for (var n = 1; n <= QUESTIONS; n++) {
      bars += '<span' + (n <= step ? ' class="on' + (grow && n === step ? ' fill' : '') + '"' : '') + '></span>';
    }
    return '<div class="plan-top">' +
      '<p class="plan-progress"><span class="plan-bars" aria-hidden="true">' + bars + '</span>STEP ' + step + ' OF ' + QUESTIONS + '</p>' +
      (step > 1 ? '<button type="button" class="plan-back" data-plan-back>Back</button>' : '') +
      '</div>';
  }

  function pressed(on) { return on ? 'true' : 'false'; }

  function tile(attr, value, item, on) {
    return '<button type="button" class="choice" ' + attr + '="' + value + '" aria-pressed="' + pressed(on) + '">' +
      '<span class="choice-title">' + item.title + '</span><span class="choice-sub">' + item.sub + '</span></button>';
  }

  function renderPlan(moveFocus, grow) {
    var stage = $('plan-stage');
    if (!stage) return;
    var html = '';

    if (plan.step === 1) {
      var goal = plan.goal || (state.goal !== 'all' ? state.goal : '');
      html = planTop(1, grow) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">WHAT\'S YOUR GOAL?</h3>' +
        '<div class="choices choices--2">' +
          '<button type="button" class="choice choice--bulk" data-plan-goal="bulk" aria-pressed="' + pressed(goal === 'bulk') + '">' + arrow('up', 40, 2.5) +
            '<span class="choice-title">BULKING</span><span class="choice-sub">Build muscle and size</span></button>' +
          '<button type="button" class="choice choice--cut" data-plan-goal="cut" aria-pressed="' + pressed(goal === 'cut') + '">' + arrow('down', 40, 2.5) +
            '<span class="choice-title">CUTTING</span><span class="choice-sub">Get lean and defined</span></button>' +
        '</div>';
    } else if (plan.step === 2) {
      html = planTop(2, grow) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">HOW DO YOU TRAIN?</h3>' +
        '<p class="plan-hint">Pick the one you do most.</p>' +
        '<div class="choices choices--5">' + TRAINING_ORDER.map(function (id) {
          return tile('data-plan-training', id, TRAINING[id], plan.training === id);
        }).join('') + '</div>';
    } else if (plan.step === 3) {
      html = planTop(3, grow) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">HOW MANY SESSIONS A WEEK?</h3>' +
        '<p class="plan-hint">Gym, runs, matches, classes. It all counts.</p>' +
        '<div class="choices choices--7">' + [1, 2, 3, 4, 5, 6, 7].map(function (n) {
          return '<button type="button" class="choice choice--num" data-plan-sessions="' + n + '" aria-pressed="' + pressed(plan.sessions === n) +
            '" aria-label="' + n + (n === 1 ? ' session' : ' sessions') + ' a week"><span class="choice-title">' + n + '</span></button>';
        }).join('') + '</div>';
    } else if (plan.step === 4) {
      html = planTop(4, grow) +
        '<h3 class="plan-q" id="plan-q" tabindex="-1">WHAT DID YOU DO TODAY?</h3>' +
        '<div class="choices choices--5">' + TRAINING[plan.training].today.map(function (id) {
          return tile('data-plan-today', id, SESSIONS[id], plan.today === id);
        }).join('') + '</div>';
    } else {
      html = renderAnswer();
    }

    stage.innerHTML = '<div class="plan-view">' + html + '</div>';
    if (moveFocus) {
      var heading = $('plan-q');
      if (heading) heading.focus();
    }
  }

  // Slide the current step out and the next one in (direction 1 = forward, -1 = back),
  // while the card eases to its new height.
  function movePlan(direction, moveFocus) {
    var stage = $('plan-stage');
    var view = stage && stage.firstElementChild;
    if (!view || !canAnimate(stage)) { plan.busy = false; renderPlan(moveFocus); return; }
    plan.busy = true;
    var from = stage.offsetHeight;
    var shift = 56 * direction;
    var out = view.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-shift) + 'px)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' });
    out.onfinish = function () {
      renderPlan(moveFocus, direction > 0);
      settlePlan(stage, from);
      var next = stage.firstElementChild;
      next.animate([{ opacity: 0, transform: 'translateX(' + shift + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE });
      stagger(next.querySelectorAll('.choice, .today, .week'), 55, 120);
      plan.busy = false;
    };
  }

  // Ease the plan card from its old height to its new one.
  function settlePlan(stage, from) {
    var to = stage.offsetHeight;
    if (from === to || !canAnimate(stage)) return;
    stage.style.overflow = 'hidden';
    var grow = stage.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 360, easing: EASE });
    grow.onfinish = grow.oncancel = function () { stage.style.overflow = ''; };
  }

  // Show the tapped answer as picked for a beat, then move to the next step.
  function choose(el, step) {
    var others = el.parentNode.querySelectorAll('.choice');
    for (var i = 0; i < others.length; i++) others[i].setAttribute('aria-pressed', others[i] === el ? 'true' : 'false');
    plan.step = step;
    if (!canAnimate(el)) { renderPlan(true); return; }
    plan.busy = true;
    pop(el);
    window.setTimeout(function () { movePlan(1, true); }, 200);
  }

  function renderAnswer() {
    var days = buildPlan(plan.goal, plan.training, plan.sessions, plan.today);
    if (!days.length) return '<p>No meals on the menu for that goal yet.</p>';
    var today = days[0];
    var session = SESSIONS[plan.today];
    var training = days.filter(function (d) { return d.training; }).length;

    var answers = '<ul class="plan-answers">' +
      '<li>' + (plan.goal === 'bulk' ? 'Bulking' : 'Cutting') + '</li>' +
      '<li>' + TRAINING[plan.training].chip + '</li>' +
      '<li>' + plan.sessions + (plan.sessions === 1 ? ' session' : ' sessions') + ' a week</li>' +
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
      var stage = $('plan-stage');
      var from = stage.offsetHeight;
      renderPlan(true);
      // The week fills in row by row.
      settlePlan(stage, from);
      stagger(stage.querySelectorAll('.week-list li, .plan-actions, .plan-foot'), 60, 0);
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
      training: plan.training,
      sessions_per_week: plan.sessions,
      did_today: plan.today,
      marketing_opt_in: $('plan-optin').checked ? 'Yes' : 'No'
    }).then(unlock);
  });

  document.addEventListener('input', function (event) {
    if (event.target.id !== 'plan-email') return;
    event.target.removeAttribute('aria-invalid');
    $('plan-email-error').textContent = '';
  });

  /* ---------- Page ---------- */

  function render() {
    renderGoal();
    applyFilter(true);
    // The first question highlights the goal picked at the top of the page.
    if (plan.step === 1 && !plan.busy) renderPlan();
    save();
  }

  document.addEventListener('click', function (event) {
    var el = event.target.closest ? event.target.closest('button') : null;
    if (!el) return;

    // Meal plan steps
    if (el.hasAttribute('data-plan-goal') || el.hasAttribute('data-plan-training') || el.hasAttribute('data-plan-sessions') ||
        el.hasAttribute('data-plan-today') || el.hasAttribute('data-plan-back') || el.hasAttribute('data-plan-restart')) {
      if (plan.busy) return; // mid-transition
      if (el.hasAttribute('data-plan-goal')) {
        plan.goal = el.getAttribute('data-plan-goal');
        state.goal = plan.goal; // one goal across the whole page
        renderGoal(); applyFilter(true); save();
        choose(el, 2);
      } else if (el.hasAttribute('data-plan-training')) {
        var training = el.getAttribute('data-plan-training');
        if (training !== plan.training) plan.today = ''; // today's options depend on the kind of training
        plan.training = training;
        choose(el, 3);
      } else if (el.hasAttribute('data-plan-sessions')) {
        plan.sessions = Number(el.getAttribute('data-plan-sessions'));
        choose(el, 4);
      } else if (el.hasAttribute('data-plan-today')) {
        plan.today = el.getAttribute('data-plan-today');
        choose(el, 5);
      } else if (el.hasAttribute('data-plan-back')) {
        plan.step = Math.max(1, plan.step - 1);
        movePlan(-1, true);
      } else {
        plan.step = 1;
        movePlan(-1, true);
      }
      return;
    }
    if (el.hasAttribute('data-print')) {
      window.print();
      return;
    }

    // Goal picker, menu filter and protein add-ons
    if (el.hasAttribute('data-goal')) {
      var goal = el.getAttribute('data-goal');
      state.goal = state.goal === goal ? 'all' : goal;
      render();
      pop(el);
      // Picking a goal at the top goes straight to its meals.
      if (state.goal !== 'all' && el.classList.contains('goal-btn')) {
        window.setTimeout(function () {
          $('menu').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
        }, 260);
      }
    } else if (el.hasAttribute('data-filter')) {
      state.goal = el.getAttribute('data-filter');
      render();
      pop(el);
    } else if (el.hasAttribute('data-addon')) {
      var addonId = el.getAttribute('data-addon');
      state.addons[addonId] = !state.addons[addonId];
      updateCard(addonId);
      save();
    }
  });

  /* ---------- Phone menu ---------- */

  var navToggle = $('nav-toggle');
  var navLinks = $('nav-links');

  function setNav(open) {
    if (!navToggle) return;
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    // While the menu covers the page, keep keyboard and screen-reader focus out of what's behind it.
    var behind = document.querySelectorAll('main, .site-footer');
    for (var i = 0; i < behind.length; i++) behind[i].inert = open;
  }

  function navIsOpen() { return document.body.classList.contains('nav-open'); }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () { setNav(!navIsOpen()); });
    // Picking a link closes the menu, then the page scrolls to that section.
    navLinks.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navIsOpen()) { setNav(false); navToggle.focus(); }
    });
    // Turning the phone or widening the window past the phone layout closes it.
    window.addEventListener('resize', function () {
      if (navIsOpen() && window.innerWidth > 820) setNav(false);
    });
  }

  // Respect "reduce motion": hold the background video on its poster frame.
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var video = document.querySelector('.hero-media');
      if (video) { video.removeAttribute('autoplay'); video.pause(); }
    }
  } catch (e) { /* leave the video as it is */ }

  renderGoal();
  buildMenu();
  renderPlan();
  booted = true;
})();
