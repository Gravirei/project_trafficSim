'use client';

import { useLucideRefresh } from '@/hooks/useLucide';
import { useViewController } from '@/hooks/useViewController';
import { AnimatedSignal } from './AnimatedSignal';
import { CycleBar } from './CycleBar';
import { Ticker } from './Ticker';
import { Counter } from './Counter';
import './landing.css';

const FIGURES = [
  {
    n: 'f1',
    src: 'https://picsum.photos/seed/gw-approach-7/1100/820.jpg',
    alt: 'Approach view',
    cap: ['FIG.01', 'NB APPROACH, LATE SHIFT'],
    meta: 'LOOP OCCUPANCY 34%',
  },
  {
    n: 'f2',
    src: 'https://picsum.photos/seed/gw-city-21/760/1010.jpg',
    alt: 'City corridor at dusk',
    cap: ['FIG.02', 'CORRIDOR COORDINATION'],
    meta: 'OFFSET +14s',
  },
  {
    n: 'f3',
    src: 'https://picsum.photos/seed/gw-desk-3/1000/620.jpg',
    alt: 'Control room',
    cap: ['FIG.03', 'THE DESK, HOUR 19'],
    meta: '12 ACTIVE ALARMS',
  },
];

const STATS = [
  { target: 40, unit: '%', label: 'of all collisions',
    body: 'happen at intersections — the only place where streams of traffic cross on purpose, many times a minute.' },
  { target: 1000, unit: '+', label: 'deaths per year',
    body: 'involve a driver running a red light in the US alone — the exact failure a well-timed clearance interval works against.' },
  { target: 25, unit: '%', label: 'of urban delay',
    body: 'is commonly attributed to outdated signal timing. Retiming is the cheapest capacity a city will ever buy.' },
];

const WHY_ROWS = [
  { n: '01', t: 'Conflict is designed, not accidental',
    p: 'Vehicle paths cross inside every junction — a cross, a Y, a roundabout each fold them differently. A signal doesn’t remove those conflicts; it schedules them, so only compatible movements ever share the same seconds.' },
  { n: '02', t: 'Clearance is the whole trick',
    p: 'Yellow is not "hurry up" — it’s the termination interval that lets a driver decide honestly. The all-red that follows empties the box before cross traffic launches. Those two seconds prevent the classic right-angle crash.' },
  { n: '03', t: 'Geometry changes the negotiation',
    p: 'A cross trades opposite greens; a Y pairs protected lefts with side rights; a roundabout never stops the circle, only the entries. Timing is maintenance — and it is written per shape.' },
  { n: '04', t: 'The controller is a negotiator',
    p: 'Actuated controllers watch detectors and trade green second-by-second: extend a busy phase, skip an empty left, hand the intersection to an ambulance. The best signal you’ll ever use is one you never notice.' },
];

export function LandingView() {
  useLucideRefresh();
  const { enterJunction, showMap } = useViewController();
  return (
    <div id="landing" className="landing">
      <nav aria-label="Primary">
        <a className="brand" href="#top">GREEN<b>WAVE</b></a>
        <div className="links">
          <a href="#numbers">The Numbers</a>
          <a href="#anatomy">The Cycle</a>
          <a href="#field">Field Notes</a>
          <a href="#why">Why It Matters</a>
        </div>
        <button className="ghostbtn" onClick={() => showMap()} aria-label="Open network map">
          NETWORK MAP
        </button>
        <button className="enter" onClick={() => enterJunction('cross')} aria-label="Enter control center for Central Cross junction">
          ENTER CONTROL CENTER
        </button>
      </nav>

      <header className="hero" id="top">
        <div className="heroL">
          <div className="eyebrow">Traffic control simulation · Live network</div>
          <h1>Who moves,<br />who <em>waits.</em></h1>
          <p className="sub">
            A traffic signal is the most safety-critical machine most people touch every day. It takes a junction where paths <b>must</b> cross and separates them — not with barriers, but with <b>time</b>. GREENWAVE models the controllers behind that decision across a small network of four very different junctions — a cross, a roundabout, a Y and a T — each with its own live desk you can run.
          </p>
          <div className="ctaRow">
            <button className="btnPrimary" onClick={() => enterJunction('cross')} aria-label="Enter the control center for Central Cross">
              ENTER THE CONTROL CENTER <i data-lucide="arrow-right" />
            </button>
            <button className="btnGhost" onClick={() => showMap()} aria-label="Open network map">
              OPEN NETWORK MAP <i data-lucide="map" />
            </button>
          </div>
          <div className="spec">4 JUNCTION SHAPES · LIVE NETWORK MAP · ACTUATED CONTROL · PEDESTRIAN CALLS · EMERGENCY PREEMPTION</div>
        </div>
        <div className="heroR">
          <AnimatedSignal />
        </div>
      </header>

      <Ticker />

      <section className="sec" id="numbers">
        <div className="eyebrow">01 — The numbers</div>
        <h2>Intersections are where<br />safety is won or lost.</h2>
        <p className="lede">Roads themselves rarely collide with each other. Junctions do — by design. Signal control exists to keep those meetings scheduled, brief, and survivable.</p>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <span className="n">
                <Counter target={s.target} />
                <b>{s.unit}</b>
              </span>
              <span className="u">{s.label}</span>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <p className="footnote">FIGURES ARE INDICATIVE, IN THE RANGE TYPICALLY REPORTED BY USDOT / FHWA / IIHS. THIS PAGE IS A DEMONSTRATION, NOT A DATA SOURCE.</p>
      </section>

      <section className="sec" id="anatomy">
        <div className="eyebrow">02 — The cycle</div>
        <h2>Anatomy of one<br />signal cycle.</h2>
        <p className="lede">A controller never shows two greens that conflict. It walks a ring of phases — green, yellow, all-red — trading the intersection between movements. Hover a segment to inspect it; click to seek.</p>
        <CycleBar />
      </section>

      <section className="sec" id="field">
        <div className="eyebrow">03 — Field notes</div>
        <h2>The view from<br />the road.</h2>
        <div className="field">
          {FIGURES.map((f) => (
            <figure key={f.n} className={`fig ${f.n}`}>
              <img
                src={f.src}
                alt={f.alt}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget.closest('figure') as HTMLElement).style.display = 'none';
                }}
              />
              <div className="cap">
                <span>
                  <b>{f.cap[0]}</b> — {f.cap[1]}
                </span>
                <span>{f.meta}</span>
              </div>
            </figure>
          ))}
          <div className="fnote">
            <div className="monoT">What operators actually watch</div>
            <p>
              Not the cars — the <span style={{ color: 'var(--ink)' }}>queues</span>. A growing left-turn pocket means a phase is starving. Cross-street spillback means a green is too short. The whole craft is noticing imbalance minutes before it becomes congestion, and rewriting the timing plan before anyone is stuck in it.
            </p>
          </div>
        </div>
      </section>

      <section className="sec" id="why">
        <div className="eyebrow">04 — Why it matters</div>
        <h2>Four ideas carry<br />every junction.</h2>
        <div className="why">
          {WHY_ROWS.map((r) => (
            <div className="wrow" key={r.n}>
              <span className="no">{r.n}</span>
              <h3>{r.t}</h3>
              <p>{r.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ctaband">
        <h2>Take the desk.</h2>
        <p>Open the network map, pick a junction — cross, roundabout, Y or T — and run it live: random demand, actuated phasing, pedestrian calls, preemption and full telemetry, all in your browser.</p>
        <div className="ctaRow">
          <button className="btnPrimary" onClick={() => enterJunction('cross')} aria-label="Enter the control center for Central Cross">
            ENTER THE CONTROL CENTER <i data-lucide="arrow-right" />
          </button>
          <button className="btnGhost" onClick={() => showMap()} aria-label="Open network map">
            OPEN NETWORK MAP <i data-lucide="map" />
          </button>
        </div>
      </section>

      <footer>
        <span>GREENWAVE — single-file traffic control simulation</span>
        <span>no data leaves your browser · figures indicative</span>
      </footer>
    </div>
  );
}
