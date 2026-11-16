import './style.css';
import { gsap } from 'gsap';
import { COPY, applyLang, type Lang } from './i18n';
import FILM from './film-status.json';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px)').matches;
const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const $$ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const frameCount = FILM as unknown as Record<string, number>;
// files in public/ live under the site's base path ("/" locally, "/vunven-landingpage/" on GitHub Pages)
const B = import.meta.env.BASE_URL;
const pub = (u: string) => (u.startsWith('/') ? B + u.slice(1) : u);

$('#year').textContent = String(new Date().getFullYear());

// ---------- language ----------
function pickLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'vi') return q;
  try {
    const saved = localStorage.getItem('vunven-lang');
    if (saved === 'en' || saved === 'vi') return saved;
  } catch {}
  return 'vi';
}
let lang = pickLang();
applyLang(lang);

// ---------- pieces of the stage ----------
const stage = $('#stage');
const cover = $('.cover');
const finale = $('.finale');
const topbar = $('#topbar');
const hrec = $('#hrec');
const chapters = $$('.ch').map((sec) => {
  const layers = $$('.layer', sec);
  const imgs = layers.map((l) => $<HTMLImageElement>('img', l));
  return {
    sec, layers, imgs,
    n: Number(sec.dataset.ch),
    frame: $('.frame', sec),
    side: $('.side', sec),
    slate: $('.slate', sec),
    take: $('.sl-k', sec),
    tc: $('.tc', sec),
    shots: imgs.map((im) => im.dataset.shot!),
    // a second picture per shot: the next pose is decoded off screen, then the two swap in one frame (never blank)
    tops: imgs.map((im) => {
      const t = im.cloneNode() as HTMLImageElement;
      t.removeAttribute('fetchpriority');
      im.after(t);
      return t;
    }),
    lines: $$('.line', sec),
    steps: $$('.step', sec),
  };
});
type Chapter = (typeof chapters)[number];
const SHOTS = chapters.length * 3;
const frameSrc = (id: string, n: number) => `${B}film/${id}/${n}${mobile ? '-sm' : ''}.webp`;
const stillSrc = (id: string) => `${B}film/${id}${mobile ? '-sm' : ''}.webp`;
const lastSrc = (id: string) => (frameCount[id] ? frameSrc(id, frameCount[id]) : stillSrc(id));
chapters.forEach((c) => c.imgs.forEach((im, i) => (im.classList.add('front'), im.src = frameCount[c.shots[i]] ? frameSrc(c.shots[i], 1) : stillSrc(c.shots[i]))));
$<HTMLImageElement>('.finale .last').src = lastSrc('5c');
if (mobile) $<HTMLImageElement>('.finale .tix').src = pub($<HTMLImageElement>('.finale .tix').dataset.sm!);

// The picture's place on the stage (the 16:9 image inside the black screen), as a clip-path inset, so the titles
// can shrink into it and the end can grow out of it.
function insetOf(el: HTMLElement, round = 4) {
  const s = stage.getBoundingClientRect();
  let { top, right, bottom, left } = el.getBoundingClientRect();
  if (getComputedStyle($('img', el)).objectFit === 'contain') {
    const w = right - left;
    const h = bottom - top;
    if (w / h > 16 / 9) {
      const pad = (w - (h * 16) / 9) / 2;
      left += pad;
      right -= pad;
    } else {
      const pad = (h - (w * 9) / 16) / 2;
      top += pad;
      bottom -= pad;
    }
  }
  return `inset(${top - s.top}px ${s.right - right}px ${s.bottom - bottom}px ${left - s.left}px round ${round}px)`;
}

// ---------- shots and chapters ----------
const SEQ = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7];
let cur = { ci: 0, k: 0 };
let shotTicks = 0;

function swap(list: HTMLElement[], k: number) {
  list.forEach((l, i) => {
    if (i === k) {
      if (l.classList.contains('on')) return;
      l.classList.remove('out');
      void l.offsetWidth; // let the entrance transition start from its hidden state
      l.classList.add('on');
    } else if (l.classList.contains('on')) {
      l.classList.remove('on');
      l.classList.add('out');
    }
  });
}
function setWords(c: Chapter, k: number) {
  swap(c.lines, k);
  c.steps.forEach((st, i) => {
    st.classList.toggle('on', i === k);
    st.classList.toggle('done', i < k);
  });
}
const clapTimers = new Map<Chapter, number[]>();
function clapper(c: Chapter, k: number) {
  if (reduceMotion) return;
  (clapTimers.get(c) ?? []).forEach(clearTimeout);
  c.take.textContent = 'ABC'[k];
  c.slate.classList.remove('clap');
  c.slate.classList.add('show');
  clapTimers.set(c, [setTimeout(() => c.slate.classList.add('clap'), 320), setTimeout(() => c.slate.classList.remove('show'), 1050)]);
}
function label() {
  const c = chapters[cur.ci];
  hrec.innerHTML = `<span class="w">${COPY[lang]['ch.word']} ${c.n}</span><span class="t"> · ${COPY[lang][`ch${c.n}.title`]}</span><span class="r">REC ${c.n}/5</span>`;
}

// Within a chapter: a quick dissolve between two still pictures, the clapper, and the words hand over.
function toShot(c: Chapter, from: number, to: number) {
  const d = reduceMotion ? 0 : 0.5;
  gsap.killTweensOf(c.layers);
  gsap.to(c.layers[to], { opacity: 1, duration: d, ease: 'power1.inOut', overwrite: true });
  if (from !== to) gsap.to(c.layers[from], { opacity: 0, duration: d, delay: d * 0.4, ease: 'power1.inOut', overwrite: true });
  c.layers.forEach((l, i) => i !== to && i !== from && gsap.set(l, { opacity: 0 }));
  setWords(c, to);
  clapper(c, to);
}

// Between chapters: the next picture wipes in from the side you scroll toward, the old one sinks back,
// and the card swaps its words. Only the film and the card move.
let wipe: gsap.core.Timeline | null = null;
function toChapter(from: number, to: number, k: number) {
  const a = chapters[from];
  const b = chapters[to];
  const down = to > from;
  wipe?.progress(1).kill();
  chapters.forEach((c, i) => c.sec.classList.toggle('on', i === from || i === to));
  gsap.killTweensOf([...a.layers, ...b.layers]);
  b.layers.forEach((l, i) => gsap.set(l, { opacity: i === k ? 1 : 0 }));
  b.lines.forEach((l) => l.classList.remove('on', 'out'));
  setWords(b, k);
  gsap.set(b.sec, { zIndex: 2 });
  gsap.set(a.sec, { zIndex: 1 });
  if (reduceMotion) {
    a.sec.classList.remove('on');
    return;
  }
  clapper(b, k);
  wipe = gsap
    .timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        a.sec.classList.remove('on');
        gsap.set([a.frame, a.side, b.frame, b.side, ...$$('.side > *', b.sec)], { clearProps: 'clipPath,scale,filter,opacity,y' });
        gsap.set([...b.imgs, ...b.tops], { clearProps: 'scale' });
      },
    })
    .fromTo(b.frame, { clipPath: down ? 'inset(100% 0% 0% 0% round 12px)' : 'inset(0% 0% 100% 0% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 0.95 }, 0)
    .fromTo([...b.imgs, ...b.tops], { scale: 1.12 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, 0)
    .to(a.frame, { scale: 0.94, filter: 'brightness(0.45)', duration: 0.95 }, 0)
    .to(a.side, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0)
    .fromTo(b.side, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3)
    .from($$('.side > *', b.sec), { y: down ? 22 : -22, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, 0.35);
}

// the light around the film follows the shot on screen
const ambs = $$<HTMLImageElement>('.amb img');
let ambOn = 0;
let ambWant = '';
function ambient(id: string) {
  const src = `${B}film/${id}-amb.webp`;
  if (mobile || src === ambWant) return;
  ambWant = src;
  const next = ambs[ambOn ^ 1];
  next.src = src;
  next.decode().catch(() => {}).then(() => {
    if (ambWant !== src) return;
    next.classList.add('on');
    ambs[ambOn].classList.remove('on');
    ambOn ^= 1;
  });
}
ambient(chapters[0].shots[0]);

function go(step: number) {
  const ci = Math.floor(step / 3);
  const k = step % 3;
  if (ci === cur.ci && k === cur.k) return;
  if (ci !== cur.ci) toChapter(cur.ci, ci, k);
  else toShot(chapters[ci], cur.k, k);
  cur = { ci, k };
  shotTicks = 0;
  restart(chapters[ci], k);
  ambient(chapters[ci].shots[k]);
  label();
  warm(ci + 1);
}
setWords(chapters[0], 0);
label();

// ---------- the clay moves: 8 poses per shot, cut like stop-motion ----------
const posed = new Map<HTMLImageElement, number>();
function restart(c: Chapter, k: number) {
  const id = c.shots[k];
  if (!frameCount[id]) return;
  c.imgs[k].src = frameSrc(id, 1);
  c.imgs[k].classList.add('front');
  c.tops[k].classList.remove('front');
  posed.set(c.imgs[k], 1);
}
function toPose(c: Chapter, k: number, n: number) {
  const a = c.imgs[k];
  if (posed.get(a) === n) return;
  posed.set(a, n);
  const back = a.classList.contains('front') ? c.tops[k] : a;
  const front = back === a ? c.tops[k] : a;
  back.src = frameSrc(c.shots[k], n);
  back.decode().catch(() => {}).then(() => {
    if (posed.get(a) !== n) return; // a newer pose already took over
    back.classList.add('front');
    front.classList.remove('front');
  });
}

// ---------- 12 fps: poses and the REC timecode (the grain is a CSS animation) ----------
const two = (n: number) => String(n).padStart(2, '0');
function filmTick() {
  const c = chapters[cur.ci];
  const id = c.shots[cur.k];
  if (frameCount[id]) toPose(c, cur.k, SEQ[Math.min(shotTicks, SEQ.length - 1)] + 1);
  const f = cur.k * 48 + shotTicks;
  c.tc.textContent = `00:${two(Math.floor(f / 12 / 60))}:${two(Math.floor(f / 12) % 60)}:${two(f % 12)}`;
  shotTicks++;
}
if (!reduceMotion) {
  let acc = 0;
  gsap.ticker.add((_t, dt) => {
    acc += dt;
    if (acc < 1000 / 12) return;
    acc %= 1000 / 12;
    filmTick();
  });
}

// Warm the next chapter's frames so playback never waits on the network.
const warmed = new Set<number>();
function warm(ci: number) {
  if (ci >= chapters.length || warmed.has(ci)) return;
  warmed.add(ci);
  chapters[ci].shots.forEach((id) => {
    for (let f = 1; f <= (frameCount[id] || 0); f++) {
      const im = new Image();
      im.src = frameSrc(id, f);
      im.decode().catch(() => {});
    }
  });
}
warm(0);
warm(1);
// Then, once the page has loaded, fetch the rest of the film in watching order, a few files at a time, so no later
// cut ever waits on the network (the next chapter is still decoded ahead by warm()).
addEventListener('load', () => {
  const urls = [
    ...chapters.flatMap((c) => c.shots.flatMap((id) => [
      ...Array.from({ length: frameCount[id] || 0 }, (_, f) => frameSrc(id, f + 1)),
      ...(mobile ? [] : [`${B}film/${id}-amb.webp`]), // the ambient light
    ])),
    ...$$<HTMLImageElement>('.finale img, .bleed .bg img').map((im) => im.currentSrc || im.src),
  ];
  const next = (): unknown => {
    const u = urls.shift();
    if (!u) return;
    const im = new Image();
    im.onload = im.onerror = next;
    im.src = u;
  };
  const idle = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 300));
  idle(() => Array.from({ length: 4 }, next));
});

// ---------- the page is a reel: one gesture = one cut ----------
// Nothing on the page scrolls. Pages: 0 the opening titles, 1..15 the shots, then the ticket, the FAQ and the end.
// Every cut plays in time the moment it is asked for. Asking again mid-cut finishes it and starts the next,
// asking the other way plays it backwards from where it is, so nothing ever waits or jumps.
const ve = $('#ve');
const faq = $('#hoi-dap');
const end = $('#het-phim');
const SHEETS = [ve, faq, end];
const LAST = SHOTS + SHEETS.length;
let page = 0;
chapters[0].sec.classList.add('on');

const opened = 'inset(0px 0px 0px 0px round 0px)';
// Edges: the cuts between page p and p+1 that are not shot changes. All tweens are fromTo so they can be
// re-measured (invalidate) and played either way.
function sheetEdge(sheet: HTMLElement, under: HTMLElement) {
  return gsap
    .timeline({ paused: true, defaults: { ease: 'power3.inOut' } })
    .fromTo(sheet, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 }, 0)
    .fromTo($('.bg img', sheet), { scale: 1.12 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, 0)
    .fromTo(under, { opacity: 1, y: 0 }, { opacity: 0.3, y: -40, duration: 0.9 }, 0)
    .fromTo($$(':scope > :not(.bg)', sheet), { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, 0.35);
}
const edges = new Map<number, gsap.core.Timeline>([
  [
    0,
    gsap
      .timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
      .fromTo('.cover .t', { opacity: 1, y: 0 }, { opacity: 0, y: -50, duration: 0.35, ease: 'power1.in' }, 0)
      .fromTo(cover, { clipPath: opened }, { clipPath: () => insetOf(chapters[0].frame), duration: 0.9 }, 0.1)
      .fromTo('.cover picture', { opacity: 1 }, { opacity: 0, duration: 0.3 }, 0.75)
      .fromTo(chapters[0].side, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.6)
      .to({}, { duration: 0.05 }),
  ],
  [
    SHOTS,
    gsap
      .timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
      .fromTo(finale, { clipPath: () => insetOf(chapters[4].frame) }, { clipPath: opened, duration: 0.9 }, 0)
      .fromTo('.finale img', { scale: 1 }, { scale: 1.04, duration: 1.2, ease: 'none' }, 0)
      .fromTo(chapters[4].side, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, 0)
      .fromTo('.finale .tix', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.55)
      .fromTo('.ve .panel', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.7),
  ],
  [SHOTS + 1, sheetEdge(faq, ve)],
  [SHOTS + 2, sheetEdge(end, faq)],
]);

// What each cut shows: layers are on whenever their cut has started, the titles go once theirs has finished.
// Driven from the cut's progress (not tweens) so it is right whichever way, or however abruptly, the cut moves.
const SHOWS = new Map<number, HTMLElement[]>([[SHOTS, [finale, ve]], [SHOTS + 1, [faq]], [SHOTS + 2, [end]]]);
function shown(p: number) {
  const pr = edges.get(p)!.progress();
  if (p === 0) cover.style.visibility = pr >= 1 ? 'hidden' : 'visible';
  else SHOWS.get(p)!.forEach((el) => (el.style.visibility = pr > 0 ? 'visible' : 'hidden'));
}
edges.forEach((tl, p) => {
  tl.eventCallback('onUpdate', () => shown(p));
  shown(p);
});

function headerLabel() {
  if (page > SHOTS) hrec.textContent = COPY[lang][(['nav.free', 'nav.faq', 'end.kicker'] as const)[page - SHOTS - 1]];
  else label();
}
function goTo(to: number) {
  if (!ready) return;
  if (to > LAST && page === LAST) return credits.skip(); // past the end: hurry the credits along
  to = Math.max(0, Math.min(LAST, to));
  if (to === page) return;
  const from = page;
  page = to;
  document.documentElement.dataset.page = String(to);
  const edge = Math.abs(to - from) === 1 ? edges.get(Math.min(to, from)) : undefined;
  // every other edge rests where this page needs it
  edges.forEach((tl, p) => {
    if (tl === edge) return;
    const t = p < to ? 1 : 0;
    if (tl.isActive() || tl.progress() !== t) tl.pause().progress(t);
    shown(p);
  });
  if (edge) {
    // re-measure the frame only when starting fresh (invalidating a finished cut breaks playing it backwards)
    if (to > from && !edge.isActive() && edge.progress() === 0) edge.invalidate();
    if (reduceMotion) edge.pause().progress(to > from ? 1 : 0);
    else if (to > from) edge.play();
    else edge.reverse();
    shown(Math.min(to, from));
  }
  go(Math.max(0, Math.min(SHOTS - 1, to - 1)));
  topbar.classList.toggle('compact', to > 0);
  headerLabel();
  markTicks();

  const sh = SHEETS[to - SHOTS - 1];
  if (sh) sh.scrollTop = to > from ? 0 : sh.scrollHeight;
  credits.at(to, from);
}

// ---------- the end: the credits roll beside Hun's bow, then (once Codex has drawn it) the scene after the credits ----------
const credits = (() => {
  const win = $('.credits .win', end);
  const crawl = $('.crawl', end);
  const skipBtn = $<HTMLButtonElement>('.skip', end);
  const screen = $('.screen', end);
  const bow = $('.bow', screen);
  const box = $('.pc', screen);
  const card = $('.card', screen);
  const line = $('.line', screen);
  const ret = $('.return', screen);
  const again = $<HTMLButtonElement>('.again', screen);
  const hasPc = frameCount.pc === 8;
  if (!hasPc) $('.tease', end).hidden = true;
  const imgs: HTMLImageElement[] = [];
  let roll: gsap.core.Tween | undefined;
  let after: gsap.core.Timeline | undefined;
  const distance = () => Math.max(0, crawl.scrollHeight - win.clientHeight);

  function load() {
    if (!hasPc || imgs.length) return;
    for (let n = 1; n <= 8; n++) {
      const im = new Image();
      im.alt = '';
      im.decoding = 'async';
      im.src = `${B}film/pc/${n}${mobile ? '-sm' : ''}.webp`;
      box.append(im);
      imgs.push(im);
    }
  }
  const frame = (i: number) => imgs.forEach((im, k) => im.classList.toggle('on', k === i));
  function resetScreen() {
    after?.kill();
    frame(-1);
    gsap.set(bow, { opacity: 1 });
    gsap.set([card, ret], { opacity: 0 });
    line.classList.remove('on');
    again.hidden = true;
  }
  // lights off, a title card, a little dance, the lamp, the freeze
  function stinger(delay: number) {
    const tl = gsap.timeline({ delay });
    const hold = (f: number, s: number) => tl.call(frame, [f]).to({}, { duration: s });
    tl.to(bow, { opacity: 0, duration: 0.8, ease: 'power2.in' })
      .fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.5 })
      .to(card, { opacity: 0, duration: 0.4 }, '+=1.3');
    [0, 1, 2, 3, 0, 1, 2, 3].forEach((f, i) => hold(f, i ? 0.22 : 0.6));
    hold(4, 0.7);
    hold(5, 0.3);
    tl.call(() => line.classList.add('on')).to({}, { duration: 1.5 });
    hold(6, 1.1);
    hold(7, 1.4);
    tl.call(() => line.classList.remove('on'))
      .fromTo(ret, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '+=0.3')
      .call(() => void (again.hidden = false));
    return tl;
  }
  function done() {
    skipBtn.hidden = true;
    if (hasPc && !reduceMotion) after = stinger(1.4);
  }
  function start() {
    roll?.kill();
    resetScreen();
    skipBtn.hidden = false;
    if (reduceMotion) {
      gsap.set(crawl, { y: -distance() });
      return done();
    }
    gsap.set(crawl, { y: 0 });
    roll = gsap.to(crawl, { y: () => -distance(), duration: distance() / 85, ease: 'none', delay: 1, onComplete: done });
  }
  function skip() {
    if (roll && roll.progress() < 1) gsap.to(roll, { timeScale: 16, duration: 0.4, ease: 'power1.in' });
  }
  skipBtn.addEventListener('click', skip);
  again.addEventListener('click', () => {
    resetScreen();
    after = stinger(0.2);
  });
  addEventListener('resize', () => roll?.invalidate());
  return {
    skip,
    at(to: number, from: number) {
      if (to >= LAST - 1) load();
      if (to === LAST) start();
      else if (from === LAST) {
        roll?.pause();
        after?.pause();
      }
    },
  };
})();

// ---------- the screen: real black bars when there is room, otherwise fill it ----------
const firstFrame = $('.frame', chapters[0].sec);
const phone = matchMedia('(max-width: 760px), (max-aspect-ratio: 1/1)');
function fitScreen() {
  const { width: w, height: h } = firstFrame.getBoundingClientRect();
  const bar = (h - (w * 9) / 16) / 2;
  const root = document.documentElement;
  root.dataset.fit = !phone.matches && bar >= 44 ? 'box' : 'fill';
  root.style.setProperty('--bar', `${Math.max(0, bar)}px`);
}
fitScreen();
addEventListener('resize', fitScreen);

// ---------- on-screen controls: back / next, the 15 ticks, and the steps themselves ----------
const ticks: HTMLElement[] = [];
chapters.forEach((c, ci) => {
  $('.pv', c.sec).addEventListener('click', () => goTo(page - 1));
  $('.nx', c.sec).addEventListener('click', () => goTo(page + 1));
  c.steps.forEach((st, k) => {
    st.tabIndex = 0;
    st.setAttribute('role', 'button');
    st.addEventListener('click', () => goTo(1 + ci * 3 + k));
    st.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), goTo(1 + ci * 3 + k)));
  });
  const box = $('.ticks', c.sec);
  chapters.forEach((_, g) => {
    const grp = document.createElement('span');
    grp.className = 'g';
    for (let k = 0; k < 3; k++) {
      const i = document.createElement('i');
      i.dataset.p = String(1 + g * 3 + k);
      i.addEventListener('click', () => goTo(1 + g * 3 + k));
      grp.append(i);
      ticks.push(i);
    }
    box.append(grp);
  });
});
function markTicks() {
  ticks.forEach((t) => {
    const p = Number(t.dataset.p);
    t.classList.toggle('on', p === page);
    t.classList.toggle('seen', p < page);
  });
}
markTicks();

// ---------- input: wheel, trackpad, touch, keys ----------
const sheetNow = () => SHEETS[page - SHOTS - 1] as HTMLElement | undefined;
const canScroll = (el: HTMLElement, dir: number) => (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2);

// One swipe = one cut. A swipe starts after a pause in the wheel stream, on a change of direction, or when the
// deltas jump up again (a new push while the trackpad's inertia is still coming in). Inertia tails never count.
let wLast = 0, wDir = 0, wPrev = 0, wSum = 0, wFired = false, wInner = false, wStepAt = 0;
addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) return; // pinch zoom
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const now = performance.now();
    const gap = now - wLast;
    wLast = now;
    const a = Math.abs(dy);
    if (a < 0.5) return;
    const dir = dy > 0 ? 1 : -1;
    const push = a > wPrev * 1.6 + 4 && now - wStepAt > 380;
    if (gap > 180 || dir !== wDir || push) {
      wFired = false;
      wInner = false;
      wSum = 0;
    }
    wDir = dir;
    wPrev = a;
    // a sheet taller than the screen scrolls on its own first; reaching its edge needs a new swipe to cut
    const sh = sheetNow();
    if (sh && !wFired && (wInner || canScroll(sh, dir))) {
      wInner = true;
      return;
    }
    e.preventDefault();
    if (wFired) return;
    wSum += a;
    if (wSum < 24) return;
    wFired = true;
    wStepAt = now;
    goTo(page + dir);
  },
  { passive: false },
);

let tY = 0, tTop = 0;
addEventListener('touchstart', (e) => {
  tY = e.touches[0].clientY;
  tTop = sheetNow()?.scrollTop ?? 0;
}, { passive: true });
addEventListener('touchmove', (e) => !sheetNow() && e.cancelable && e.preventDefault(), { passive: false });
addEventListener('touchend', (e) => {
  const dy = tY - e.changedTouches[0].clientY;
  const sh = sheetNow();
  if (Math.abs(dy) < 40 || (sh && Math.abs(sh.scrollTop - tTop) > 2)) return;
  goTo(page + (dy > 0 ? 1 : -1));
});

addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).closest('input, textarea')) return;
  const down = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
  const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
  if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault();
    return goTo(e.key === 'Home' ? 0 : LAST);
  }
  if (!down && !up) return;
  if (e.key === ' ' && (e.target as HTMLElement).closest('button, summary, a')) return;
  e.preventDefault();
  const dir = down ? 1 : -1;
  const sh = sheetNow();
  if (sh && canScroll(sh, dir)) sh.scrollBy({ top: dir * innerHeight * 0.6, behavior: reduceMotion ? 'auto' : 'smooth' });
  else goTo(page + dir);
});

// links inside the page jump to their page
const PAGE_OF: Record<string, number> = { top: 0, ve: SHOTS + 1, 'hoi-dap': SHOTS + 2, 'het-phim': SHOTS + 3 };
$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!.slice(1);
    const m = /^c(\d)$/.exec(id);
    const to = m ? 1 + (Number(m[1]) - 1) * 3 : PAGE_OF[id];
    if (to === undefined) return;
    e.preventDefault();
    goTo(to);
  }),
);

// ---------- opening titles ----------
// ---------- loading: the poster and the whole first chapter, before the house lights go down ----------
let ready = false;
{
  const urls = [
    mobile ? `${B}film/poster-4x5-sm.webp` : `${B}film/poster-16x9.webp`,
    ...chapters[0].shots.flatMap((id) => Array.from({ length: frameCount[id] || 1 }, (_, f) => (frameCount[id] ? frameSrc(id, f + 1) : stillSrc(id)))),
    ...chapters.slice(1).map((c) => (frameCount[c.shots[0]] ? frameSrc(c.shots[0], 1) : stillSrc(c.shots[0]))),
  ];
  const bar = $('#loader');
  let done = 0;
  const all = urls.length + 1;
  const tick = () => bar.style.setProperty('--p', String(++done / all));
  // the countdown always runs to 1 (about 1.8s); the house lights go down once the frames are in too
  const leader = $('.leader', bar);
  const num = $('.n', bar);
  const count = reduceMotion
    ? Promise.resolve()
    : new Promise<void>((done) => {
        const tl = gsap.timeline({ onComplete: done });
        [3, 2, 1].forEach((n, i) => {
          tl.call(() => void (num.textContent = String(n)), [], i * 0.6);
          tl.fromTo(num, { scale: 1.25, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' }, i * 0.6);
          tl.fromTo('.leader .sweep', { '--a': '0deg' }, { '--a': '360deg', duration: 0.6, ease: 'none' }, i * 0.6);
        });
        tl.call(() => bar.classList.add('wait')); // frames still coming: keep the leader spinning on 1
      });
  const start = () => {
    if (ready) return;
    ready = true;
    if (reduceMotion) {
      document.documentElement.classList.add('ready');
      return;
    }
    // projector light: the leader rushes past, a warm flash, then the poster settles in
    gsap
      .timeline({ onComplete: () => document.documentElement.classList.add('ready') })
      .to(leader, { scale: 2.6, opacity: 0, filter: 'blur(6px)', duration: 0.6, ease: 'power3.in' })
      .to([$('p', bar), $('.ld', bar)], { opacity: 0, duration: 0.25 }, 0)
      .to(bar, { background: '#fff3dd', duration: 0.08 }, 0.5)
      .to(bar, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.58);
    gsap.from('.cover .t > *', { opacity: 0, y: 26, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.8 });
    gsap.fromTo('.cover img', { scale: 1.12 }, { scale: 1, duration: 2.8, ease: 'power2.out', delay: 0.5 });
  };
  Promise.all([
    ...urls.map((u) => {
      const im = new Image();
      im.src = u;
      return im.decode().catch(() => {}).finally(tick);
    }),
    document.fonts.ready.finally(tick),
  ])
    .then(() => count)
    .then(start);
  setTimeout(start, 12000); // never hold the audience longer than this
}

// ---------- language switch ----------
$$<HTMLButtonElement>('.lang button').forEach((b) =>
  b.addEventListener('click', () => {
    lang = b.dataset.lang as Lang;
    applyLang(lang);
    headerLabel();
    try {
      localStorage.setItem('vunven-lang', lang);
    } catch {}
  }),
);

// ---------- the credits' backdrops: load them early so the cut never shows an empty sheet ----------
$$<HTMLImageElement>('.bleed .bg img').forEach((im) => {
  if (mobile) im.src = pub(im.dataset.sm!);
  im.loading = 'eager';
});
