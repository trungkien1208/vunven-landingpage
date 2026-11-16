#!/usr/bin/env python3
"""Writes site/index.html for the five-chapter layout. Vietnamese copy is read from src/i18n.ts so the
static HTML matches what applyLang('vi') would render (good for no-JS and crawlers)."""
import re, html, sys
import os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = open(f'{SITE}/src/i18n.ts').read()
vi_block = src[src.index('  vi: {'):src.index('  en: {')]
VI = {k: v.replace("\\'", "'") for k, v in re.findall(r"'([\w.]+)':\s*'((?:[^'\\]|\\.)*)'", vi_block)}

def t(key, tag='span', cls='', extra=''):
    c = f' class="{cls}"' if cls else ''
    return f'<{tag}{c} data-t="{key}"{extra}>{VI.get(key, "")}</{tag}>'

CREDITS = [('cast', ['hun', 'mum', 'dad', 'kid', 'gran', 'kettle']), ('crew', ['dir', 'script', 'lines', 'stunt', 'art', 'code', 'light', 'sfx', 'slate', 'food']), ('extras', ['fish', 'scooter', 'popcorn']), ('sets', ['house', 'alley']), ('costume', ['heart', 'family']), ('tech', ['vite', 'ts', 'gsap', 'sharp', 'webp', 'py', 'node', 'npm', 'fontsource', 'fraunces', 'bvp', 'itim', 'phosphor', 'grain', 'prop', 'cq', 'amb', 'i18n', 'test', 'absent']), ('figs', ['shots', 'frames', 'fps', 'finger', 'meds', 'clay', 'score']), ('sponsor', ['diamond', 'gold', 'silver', 'partner', 'media'])]
ICON = {1: 'heart', 2: 'heartbeat', 3: 'wallet', 4: 'users-three', 5: 'lock-key'}
PH = f'{SITE}/node_modules/@phosphor-icons/core/assets'
def icon(name, weight='duotone', cls='ico'):
    # Phosphor icons inlined, so they take the text colour and need no extra request
    suffix = '' if weight == 'regular' else f'-{weight}'
    svg = open(f'{PH}/{weight}/{name}{suffix}.svg').read().strip()
    return svg.replace('<svg ', f'<svg class="{cls}" aria-hidden="true" ', 1)

SPEAKER = re.compile(r'^([^:“"<]{1,40}): (.+)$')
def sub(v):
    # "Mẹ: “...”" -> the speaker as a small label, then the line
    m = SPEAKER.match(v)
    return f'<b class="who">{m.group(1)}</b>{m.group(2)}' if m else v

def slate(n):
    return f'''<div class="slate" aria-hidden="true"><svg viewBox="0 0 100 84"><defs><pattern id="st{n}" width="18" height="14" patternUnits="userSpaceOnUse" patternTransform="skewX(-40)"><rect width="18" height="14" fill="#1d1d1f"/><rect width="9" height="14" fill="#f6f1e6"/></pattern></defs><rect x="3" y="30" width="94" height="52" rx="4" fill="#1d1d1f"/><rect x="3" y="20" width="94" height="11" fill="url(#st{n})" stroke="#1d1d1f" stroke-width="2"/><g class="arm"><rect x="3" y="6" width="94" height="12" rx="2" fill="url(#st{n})" stroke="#1d1d1f" stroke-width="2"/></g><circle cx="7" cy="19" r="3" fill="#8e8a84" stroke="#1d1d1f" stroke-width="1.5"/><line x1="9" y1="56" x2="91" y2="56" stroke="#f6f1e6" stroke-opacity=".35"/><line x1="50" y1="56" x2="50" y2="78" stroke="#f6f1e6" stroke-opacity=".35"/><text x="50" y="49" text-anchor="middle" fill="#f6f1e6" class="sl-t">VUN VÉN</text><text x="28" y="74" text-anchor="middle" fill="#f6f1e6" class="sl-c">0{n}<tspan class="sl-k">A</tspan></text><text x="72" y="74" text-anchor="middle" fill="#f6f1e6" class="sl-c sl-s">{VI[f"ch{n}.time"]}</text></svg></div>'''

def chapter(n):
    lazy = ' loading="lazy"' if n > 1 else ''
    shots = ''.join(f'<div class="layer"><img src="/film/{n}{s}.webp" data-shot="{n}{s}" alt="" decoding="async"{lazy}></div>' for s in 'abc')
    lines = ''.join(f'<p class="line"><span data-t="ch{n}.{s}" data-sub>{sub(VI.get(f"ch{n}.{s}", ""))}</span></p>' for s in 'abc')
    steps = ''.join(f'<li class="step"><span class="no">{i}</span><span class="tx">{t(f"ch{n}.i{s}", "b")}{t(f"ch{n}.d{s}", "small")}</span></li>' for i, s in enumerate('abc', 1))
    return f'''
          <article class="ch{" on" if n == 1 else ""}" id="c{n}" data-ch="{n}" aria-labelledby="c{n}-title">
            <div class="box">
              <div class="frame">
                {shots}
                <i class="grain" aria-hidden="true"></i>
                {slate(n)}
                <span class="rec" aria-hidden="true"><i></i>REC <b class="tc">00:00:00</b></span>
                <div class="subs" aria-live="polite">{lines}</div>
              </div>
              <aside class="side">
                <p class="k">{t("ch.word")} {n} · {t(f"ch{n}.title")} · {t(f"ch{n}.time")}</p>
                <div class="feat-head"><span class="tile">{icon(ICON[n])}</span>{t(f"ch{n}.feat", "h2", extra=f' id="c{n}-title"')}</div>
                {t(f"ch{n}.app", "p", "lead")}
                <ol class="steps">{steps}</ol>
                <div class="pn"><button type="button" class="pv">{icon("arrow-left", "bold", "ar")}{t("ctrl.prev")}</button><span class="ticks" aria-hidden="true"></span><button type="button" class="nx">{t("ctrl.next")}{icon("arrow-right", "bold", "ar")}</button></div>
              </aside>
            </div>
          </article>'''

page = f'''<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>{VI["meta.title"]}</title>
    <meta name="description" content="{html.escape(VI["meta.desc"])}" />
    <link rel="canonical" href="https://vunven.tdk.best/" />
    <link rel="alternate" hreflang="vi" href="https://vunven.tdk.best/" />
    <link rel="alternate" hreflang="en" href="https://vunven.tdk.best/?lang=en" />
    <meta name="theme-color" content="#0f1620" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta property="og:site_name" content="Vun Vén" />
    <meta property="og:url" content="https://vunven.tdk.best/" />
    <meta property="og:title" content="{VI["meta.title"]}" />
    <meta property="og:description" content="{html.escape(VI["meta.desc"])}" />
    <meta property="og:image" content="https://vunven.tdk.best/og.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preload" as="image" href="/film/poster-16x9.webp" media="(min-width: 761px)" />
    <link rel="preload" as="image" href="/film/poster-4x5-sm.webp" media="(max-width: 760px)" />
  </head>
  <body>
    <div class="loader" id="loader" role="status"><div class="leader" aria-hidden="true"><i class="sweep"></i><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="80"/><path d="M100 0v200M0 100h200"/></svg><b class="n">3</b></div>{t("load.text", "p")}<div class="ld"><i></i></div></div>
    <a class="skip" href="#c1" data-t="skip">{VI["skip"]}</a>

    <header class="top" id="topbar">
      <div class="bar">
        <a class="brand" href="#top"><img src="/apple-touch-icon.png" alt="" width="30" height="30"><span>Vun Vén</span></a>
        <span class="hrec" aria-live="polite"><i aria-hidden="true"></i><b id="hrec">REC</b></span>
        <nav class="links" data-t-aria="nav.label" aria-label="{VI["nav.label"]}"><a href="#c1">{t("nav.film")}</a><a href="#hoi-dap">{t("nav.faq")}</a><a href="#ve">{t("nav.free")}</a></nav>
        <span class="lang" role="group" data-t-aria="lang.label" aria-label="{VI["lang.label"]}"><button type="button" data-lang="vi" aria-pressed="true">VI</button><button type="button" data-lang="en" aria-pressed="false">EN</button></span>
        <a class="cta" href="#het-phim">{t("nav.cta")}</a>
      </div>
    </header>

    <main>
      <section class="film" id="top" aria-label="Phim">
        <div class="stage" id="stage">
          <div class="amb" aria-hidden="true"><img alt=""><img alt=""></div>
{''.join(chapter(n) for n in range(1, 6))}
          <div class="cover" aria-labelledby="intro-title">
            <picture><source media="(max-width: 760px)" srcset="/film/poster-4x5-sm.webp"><img class="poster" src="/film/poster-16x9.webp" alt="" fetchpriority="high"></picture>
            <div class="t">
              {t("intro.presents", cls="presents")}
              <h1 id="intro-title"><span>VUN</span> <span>VÉN</span></h1>
              {t("intro.tag", "p", "tag")}
              {t("prologue", "p", "logline")}
              <a class="cue" href="#c1">{t("intro.cue")}{icon("arrow-down", "bold", "ar")}</a>
              <div class="billing">{t("intro.billing", "p", "bk")}<ol>{''.join(f'<li><i>{n}</i>{t(f"ch{n}.feat")}</li>' for n in range(1, 6))}</ol></div>
            </div>
          </div>
          <div class="finale" aria-hidden="true"><img class="last" src="/film/5c.webp" alt=""><img class="tix" src="/film/ticket.webp" data-sm="/film/ticket-sm.webp" alt=""></div>
        </div>
        <div class="runway" id="runway"></div>

        <section class="ve" id="ve" aria-labelledby="ve-title">
        <div class="panel">
          <div class="phead"><div>{t("ticket.kicker", cls="k")}{t("ticket.title", "h2", extra=' id="ve-title"')}</div>{t("ticket.lead", "p", "lead")}</div>
          <div class="price">
            <div class="free">
              {t("ticket.stamp", cls="stamp")}
              <div class="big">{t("ticket.free")}{t("ticket.freeSub", "small")}</div>
              <ul>{''.join(t(f"ticket.f{i}", "li") for i in range(1, 7))}</ul>
            </div>
            <div class="plus">
              {t("ticket.plusKicker", cls="k")}
              <h3>Hun Plus</h3>
              <div class="tiers"><div class="tier"><b>49.000đ</b>{t("ticket.month")}</div><div class="tier"><b>399.000đ</b>{t("ticket.year")}</div></div>
              <ul>{''.join(t(f"ticket.p{i}", "li") for i in range(1, 5))}</ul>
            </div>
          </div>
          {t("ticket.fine", "p", "fine")}
        </div>
      </section>
      </section>

      <section class="bleed" id="hoi-dap" aria-labelledby="faq-title">
        <div class="bg"><img src="/film/faq.webp" data-sm="/film/faq-sm.webp" alt="" loading="lazy"></div>
        <div class="panel">
          <div class="phead"><div>{t("faq.kicker", cls="k")}{t("faq.title", "h2", extra=' id="faq-title"')}</div><p class="lead">{t("faq.lead")} <span class="mail">support@tdk.best</span></p></div>
          <div class="faq">{''.join(f'<details{" open" if i == 1 else ""}>{t(f"faq.q{i}", "summary")}{t(f"faq.a{i}", "p")}</details>' for i in range(1, 7))}</div>
        </div>
      </section>

      <section class="bleed end" id="het-phim" aria-labelledby="end-title">
        <div class="bg"><img src="/film/end-amb.webp" data-sm="/film/end-amb.webp" alt="" loading="lazy"></div>
        <div class="theatre">
          <div class="screen">
            <img class="bow" src="/film/end.webp" data-sm="/film/end-sm.webp" alt="" loading="lazy">
            <div class="pc" aria-hidden="true"></div>
            <i class="grain" aria-hidden="true"></i>
            {t("pc.card", "p", "card")}
            <div class="subs"><p class="line"><span data-t="pc.line" data-sub>{sub(VI["pc.line"])}</span></p></div>
            {t("pc.return", "p", "return")}
            <button type="button" class="again" hidden>{icon("arrow-counter-clockwise", "bold", "ar")}{t("pc.again")}</button>
          </div>
          <aside class="credits" aria-label="Credits">
            <div class="win"><div class="crawl">
              <div class="list">
                <div class="open">{t("cr.presents", "p", "by")}<p class="name">VUN VÉN</p>{t("cr.sub", "p", "csub")}</div>
                {''.join(f'<div class="grp">{t(f"cr.g.{g}", "h4")}<dl>' + ''.join(t(f"cr.{r}.r", "dt") + t(f"cr.{r}.n", "dd") for r in rows) + '</dl></div>' for g, rows in CREDITS)}
                <div class="grp thx">{t("cr.g.thx", "h4")}{''.join(t(f"cr.thx.{i}", "p") for i in (1, 2, 3))}</div>
                <div class="grp prod">{t("cr.g.prod", "h4")}<img src="/apple-touch-icon.png" alt="" width="56" height="56" loading="lazy">{t("cr.company", "p", "co")}{t("cr.year", "p", "yr")}</div>
                {t("cr.fiction", "p", "harm")}
                {t("cr.harm", "p", "harm")}
                {t("cr.rights", "p", "harm")}
                {t("cr.tease", "p", "tease")}
              </div>
              <div class="fin">
                <div class="call">
                  {t("end.kicker", cls="k")}
                  {t("end.title", "h2", extra=' id="end-title"')}
                  {t("end.line", "p", "voice")}
                  <a class="btn" href="mailto:support@tdk.best?subject=Vun%20V%C3%A9n">{t("end.cta")}</a>
                  <p class="fine">{t("end.fine")} <span class="mail">support@tdk.best</span></p>
                </div>
                <footer class="foot"><span>© <span id="year">2026</span> Vun Vén · <a href="https://tdk.best/" target="_blank" rel="noopener">tdk.best</a></span><span><a href="https://tdk.best/product/vunven/privacy" target="_blank" rel="noopener" data-t="foot.privacy">{VI["foot.privacy"]}</a> · <a href="https://tdk.best/product/vunven/termandcondition" target="_blank" rel="noopener" data-t="foot.terms">{VI["foot.terms"]}</a></span></footer>
              </div>
            </div></div>
            <button type="button" class="skip">{t("end.skip")}{icon("fast-forward", "fill", "ar")}</button>
          </aside>
        </div>
      </section>
    </main>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
'''
open(f'{SITE}/index.html', 'w').write(page)
missing = [k for k in re.findall(r'data-t="([\w.]+)"', page) if k not in VI]
print('written; missing keys:', sorted(set(missing)))
