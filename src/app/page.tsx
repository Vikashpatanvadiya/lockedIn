import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PillLink } from "@/components/PillButton";
import { BookCover, Sticker } from "@/components/BookCover";
import { getUserId } from "@/lib/session";
import { Cloud } from "@/components/Cloud";
import { Landscape } from "@/components/Landscape";

export default async function Landing() {
  const signedIn = Boolean(await getUserId());
  const cta = signedIn ? { href: "/book", label: "Open your book" } : { href: "/signup", label: "Start your book" };

  return (
    <main className="overflow-x-clip">
      <Nav signedIn={signedIn} cta={cta} />
      <Hero cta={cta} />
      <Marquee />
      <Manifesto />
      <HowItWorks />
      <SpreadPreview />
      <GrowthPreview />
      <SkyCta cta={cta} />
      <Footer signedIn={signedIn} />
    </main>
  );
}

type Cta = { href: string; label: string };

function Nav({ signedIn, cta }: { signedIn: boolean; cta: Cta }) {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-line/70 bg-page/85 pl-6 pr-1.5 shadow-[0_8px_30px_-12px_rgba(42,29,18,0.18)] backdrop-blur-md">
        <Link href="/" aria-label="LockedIn home" className="text-ink">
          <Logo className="h-[18px]" />
        </Link>
        <div className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#why" className="hover:text-ink">Why</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#page" className="hover:text-ink">A day&apos;s page</a>
          <a href="#growth" className="hover:text-ink">Growth</a>
        </div>
        <div className="flex items-center gap-2">
          {!signedIn && (
            <Link href="/login" className="hidden px-3 text-sm font-medium text-ink-soft hover:text-ink sm:block">
              Log in
            </Link>
          )}
          <PillLink href={cta.href} tone="periwinkle" className="h-11 text-sm">
            {cta.label}
          </PillLink>
        </div>
      </nav>
    </header>
  );
}

function Hero({ cta }: { cta: Cta }) {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-36 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-40">
      <div>
        <p className="font-hand text-2xl text-orange -rotate-2">Dear future me,</p>
        <h1 className="font-display mt-2 text-[clamp(44px,7.4vw,92px)] font-semibold leading-[0.95] tracking-[-0.02em]">
          One year.
          <br />
          One book.
          <br />
          <span className="font-serif font-normal italic tracking-[-0.01em]">Written</span> by you.
        </h1>
        <p className="mt-7 max-w-md font-serif text-xl leading-relaxed text-ink-soft">
          Not another task manager. A diary for the year between this birthday and the next — so you plan with purpose,
          live fully, and end each day{" "}
          <span className="relative whitespace-nowrap text-ink">
            without regret.
            <span className="absolute -right-14 -top-4 font-hand text-lg text-orange rotate-6">really!</span>
          </span>
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <PillLink href={cta.href}>{cta.label}</PillLink>
          <a href="#how" className="text-sm font-medium text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
            See how it works
          </a>
        </div>
        <p className="mt-6 text-sm text-ink-faint">Free, private, and yours. No feeds. No followers.</p>
      </div>

      <div className="relative mx-auto w-full max-w-[420px]">
        <div className="absolute -left-10 top-6 hidden -rotate-6 font-hand text-xl leading-tight text-ink-soft lg:block">
          your title,
          <br />
          your photo
          <svg viewBox="0 0 60 40" className="ml-10 mt-1 h-8 w-12 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M2 4c20 2 36 12 48 30M50 34l1-10M50 34l-10-2" strokeLinecap="round" />
          </svg>
        </div>
        <BookCover
          title="Year 21"
          subtitle="The year I stop waiting and start doing."
          color="kraft"
          owner="Param"
          label="Days"
          days={365}
          pencil
          stickers
          className="w-full rotate-[4deg] animate-float [--r:4deg]"
        />
        <Sticker kind="star" className="!size-14 -left-6 bottom-16 -rotate-12" />
        <div className="absolute -bottom-6 right-2 rotate-[-4deg] rounded-xl bg-sun px-4 py-2 font-hand text-xl shadow-md">
          Day 1 of 365 ✦
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [
    "Not a rat race",
    "Birthday to birthday",
    "One page a day",
    "Plan it. Live it. Own it.",
    "Your social life counts too",
    "No regret at 11:59 pm",
    "You vs. yesterday",
  ];
  const row = [...items, ...items];
  return (
    <div className="border-y border-line bg-page py-4">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-lg font-medium text-ink-soft">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="text-orange">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Manifesto() {
  return (
    <section id="why" className="mx-auto max-w-2xl scroll-mt-28 px-6 py-24 md:py-32">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">Why this exists</p>
      <h2 className="mt-4 text-center font-serif text-[clamp(34px,5vw,52px)] leading-[1.08] tracking-[-0.01em]">
        It starts with a letter <em>to yourself.</em>
      </h2>
      <div className="mt-12 space-y-6 font-serif text-[19px] leading-[1.75] text-ink/90">
        <p>
          Before you set a single goal, you write to the person you&apos;ll be a year from now. Why are you here? What
          would make you proud — and make your family proud?
        </p>
        <p className="text-[24px] leading-snug">
          <span className="hl">You have air in your lungs and work to do.</span>
        </p>
        <p className="rounded-xl border-2 border-mint/80 p-5">
          We&apos;re not asking you to live by the clock. See friends. Rest. Do whatever you like. Just don&apos;t lose
          hours to <span className="ring-hand">endless scrolling</span> and end the day thinking <em>&ldquo;I had
          decided to do this, and I didn&apos;t.&rdquo;</em>
        </p>
        <p>
          LockedIn gives your year the shape of a book. Your letter opens it. Each chapter runs from one birthday to the
          next. And every single day gets its own page — so <span className="ul-rose">planning becomes calm, not
          overthinking.</span>
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: (
        <>
          write your <em className="font-serif">letter</em>
        </>
      ),
      body: "Sign up, then write to yourself: why you're here, and who you want to become this year.",
      bg: "bg-sun",
      art: <LetterArt />,
    },
    {
      n: "02",
      title: (
        <>
          design your <em className="font-serif">book</em>
        </>
      ),
      body: "Upload a cover photo, choose a title and a subtitle. It's your diary — it should look like it.",
      bg: "bg-orange text-white",
      art: <CoverArt />,
    },
    {
      n: "03",
      title: (
        <>
          open a <em className="font-serif">chapter</em>
        </>
      ),
      body: "Name it (“Year 21”), list your goals, set the end date to your next birthday. Every day in between becomes a page — automatically.",
      bg: "bg-periwinkle",
      art: <ChapterArt />,
    },
    {
      n: "04",
      title: (
        <>
          fill <em className="font-serif">one page</em> a day
        </>
      ),
      body: "A thought, today's tasks, a free corner for anything, and an end-of-day summary. Then watch your year fill with colour.",
      bg: "bg-forest text-paper",
      art: <HeatArt />,
    },
  ];
  return (
    <section id="how" className="scroll-mt-28 bg-paper-2/60 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-[clamp(36px,5.4vw,64px)] font-medium leading-[1.02] tracking-[-0.02em]">
          plan with <em className="font-serif font-normal">purpose,</em>
          <br />
          not pressure
        </h2>
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {steps.map((s) => (
            <article key={s.n} className={`relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[28px] p-8 ${s.bg}`}>
              <div>
                <span className="font-hand text-2xl opacity-70">{s.n}</span>
                <h3 className="mt-2 font-display text-[34px] font-medium leading-tight tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed opacity-80">{s.body}</p>
              </div>
              <div className="pointer-events-none mt-6 flex justify-end">{s.art}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LetterArt() {
  return (
    <div className="w-64 rotate-[-3deg] rounded-lg bg-page p-4 text-ink shadow-lg ruled">
      <p className="font-hand text-xl leading-8">Dear me,</p>
      <p className="font-hand text-lg leading-8 text-ink-soft">this year we finally ship the thing, run the 10k and call mom more…</p>
    </div>
  );
}

function CoverArt() {
  return (
    <div className="flex items-end gap-3">
      <BookCover title="Year 21" color="sky" className="w-28 -rotate-6" />
      <BookCover title="Glow up" color="blush" className="w-28 rotate-3" />
    </div>
  );
}

function ChapterArt() {
  return (
    <div className="w-72 rounded-2xl bg-page p-4 text-ink shadow-lg">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Chapter 1 · 21 Sep → 7 Mar</p>
      <p className="mt-1 font-display text-xl font-semibold">Year 21</p>
      <ul className="mt-3 space-y-2 text-sm">
        {["Ship my portfolio site", "Read 12 books", "Run a 10k"].map((g, i) => (
          <li key={g} className="flex items-center gap-2">
            <span className={`grid size-4 place-items-center rounded-[5px] border ${i === 0 ? "border-forest bg-forest text-white" : "border-ink/30"}`}>
              {i === 0 && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className={i === 0 ? "text-ink-faint line-through" : ""}>{g}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeatArt() {
  const levels = heatLevels(7 * 18, 7);
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px] rounded-xl bg-white/5 p-3">
      {levels.map((l, i) => (
        <span key={i} className="size-[11px] rounded-[3px]" style={{ background: HEAT_DARK[l] }} />
      ))}
    </div>
  );
}

const HEAT_DARK = ["rgba(255,255,255,0.08)", "#6c9a62", "#8fc47a", "#c4e37f", "#fce38a"];
const HEAT = ["#efe8dc", "#f9d9b8", "#f5ad76", "#ec7d3c", "#c9531c"];

function heatLevels(n: number, seed: number) {
  let s = seed;
  return Array.from({ length: n }, (_, i) => {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const ramp = i / n;
    return Math.min(4, Math.floor(r * 3 + ramp * 2.4));
  });
}

function SpreadPreview() {
  return (
    <section id="page" className="scroll-mt-28 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-hand text-2xl text-orange">a day&apos;s page</p>
          <h2 className="mt-1 font-serif text-[clamp(34px,5vw,52px)] leading-[1.08]">
            It opens like a <em>real book.</em>
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Cover, then your letter and index, then straight to today&apos;s page. Flip back to any day of your chapter.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="absolute inset-x-8 -bottom-3 top-3 rounded-[22px] bg-kraft-dark" />
          <div className="relative grid overflow-hidden rounded-[18px] book-shadow md:grid-cols-2">
            <div className="ruled page-left px-8 pb-10 pt-8 md:px-12">
              <div className="flex items-baseline justify-between text-xs font-medium uppercase tracking-widest text-ink-faint">
                <span>Year 21 · Chapter 1</span>
                <span>Tue, Oct 10</span>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink-faint">Today&apos;s thought</p>
              <p className="font-hand text-[26px] leading-8">Small steps still move me forward.</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink-faint">Today&apos;s tasks</p>
              <ul className="mt-1 font-hand text-[22px] leading-8">
                {[
                  ["Finish chapter 3 notes", true],
                  ["Gym — legs", true],
                  ["Apply to 2 internships", true],
                  ["Call Dadi", false],
                ].map(([t, d]) => (
                  <li key={t as string} className="flex items-center gap-3">
                    <span className={`grid size-5 place-items-center rounded-md border-2 ${d ? "border-orange bg-orange text-white" : "border-ink/30"}`}>
                      {d && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className={d ? "text-ink-faint line-through decoration-orange/60" : ""}>{t as string}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-right font-hand text-lg text-ink-faint">— 20 —</p>
            </div>
            <div className="ruled page-right px-8 pb-10 pt-8 md:px-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Do whatever you like</p>
              <p className="font-hand text-[22px] leading-8 text-ink-soft">Cricket with the boys at 6. Mango lassi. Worth it. ☺</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink-faint">End of the day</p>
              <p className="font-hand text-[22px] leading-8">Didn&apos;t call Dadi — first thing tomorrow. Otherwise a solid day.</p>
              <p className="mt-6 font-hand text-lg text-ink-faint">— 21 —</p>
            </div>
          </div>
          <Sticker kind="sun" className="!size-16 -right-4 -top-6 rotate-12" />
        </div>
      </div>
    </section>
  );
}

function GrowthPreview() {
  const levels = heatLevels(7 * 30, 21);
  return (
    <section id="growth" className="scroll-mt-28 px-6 pb-24 md:pb-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 rounded-[32px] bg-page p-8 ring-1 ring-line md:grid-cols-[0.9fr_1.1fr] md:p-14">
        <div>
          <p className="font-hand text-2xl text-orange">growth, not grind</p>
          <h2 className="mt-1 font-display text-[clamp(32px,4.4vw,52px)] font-medium leading-[1.02] tracking-[-0.02em]">
            the more you do,
            <br />
            the <em className="font-serif font-normal">warmer</em> it gets
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            Every completed task colours in its day. See your streak, your task and goal completion, and how far through
            the chapter you are — at a glance.
          </p>
          <dl className="mt-8 grid max-w-sm grid-cols-3 gap-4">
            {[
              ["12", "day streak"],
              ["78%", "tasks done"],
              ["3/8", "goals"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl font-semibold">{v}</dt>
                <dd className="text-sm text-ink-soft">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="overflow-hidden rounded-2xl bg-paper p-5 ring-1 ring-line">
          <div className="flex justify-between text-xs text-ink-faint">
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
          </div>
          <div className="mt-2 grid grid-flow-col grid-rows-7 gap-[3px]">
            {levels.map((l, i) => (
              <span key={i} className="aspect-square rounded-[3px]" style={{ background: HEAT[l] }} />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-ink-faint">
            Less
            {HEAT.map((c) => (
              <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} />
            ))}
            More
          </div>
        </div>
      </div>
    </section>
  );
}

function SkyCta({ cta }: { cta: Cta }) {
  return (
    <section className="sky relative z-10 overflow-x-clip px-6 pb-40 pt-28 text-center text-white md:pb-48 md:pt-36">
      <Cloud className="left-[-14%] top-[46%] w-[38%]" />
      <Cloud variant={1} className="right-[-16%] top-[46%] w-[40%]" />
      <Cloud className="left-[30%] top-[64%] w-[40%]" />
      <Cloud variant={2} className="left-[6%] top-[6%] w-[16%] opacity-80" />
      <Cloud variant={2} className="right-[8%] top-[4%] w-[14%] opacity-70" />
      <div className="relative">
        <p className="font-hand text-2xl text-white/90">your birthday is coming either way</p>
        <h2 className="mx-auto mt-2 max-w-3xl font-serif text-[clamp(40px,6.4vw,76px)] leading-[1.02] tracking-[-0.01em] drop-shadow-[0_2px_20px_rgba(0,60,140,0.25)]">
          Start the chapter
          <br />
          you&apos;ll be proud of.
        </h2>
        <div className="mt-10 flex justify-center">
          <PillLink href={cta.href} tone="paper" className="shadow-xl">
            {cta.label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}

function Footer({ signedIn }: { signedIn: boolean }) {
  const columns = [
    {
      title: "The book",
      links: [
        { label: "Why it exists", href: "#why" },
        { label: "How it works", href: "#how" },
        { label: "A day\u2019s page", href: "#page" },
        { label: "Growth", href: "#growth" },
      ],
    },
    {
      title: "Your book",
      links: signedIn
        ? [
            { label: "Open my book", href: "/book" },
            { label: "Growth", href: "/growth" },
            { label: "Profile", href: "/profile" },
          ]
        : [
            { label: "Start your book", href: "/signup" },
            { label: "Log in", href: "/login" },
          ],
    },
  ];

  return (
    <footer
      className="relative isolate overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f4f8fc 0%, #f8efe2 30%, #fbd9b0 62%, #f6c28c 100%)" }}
    >
      <Landscape className="absolute bottom-0 -left-[180px] -z-10 w-[max(100%,900px)] sm:left-1/2 sm:-translate-x-1/2" />
      <div className="mx-auto max-w-6xl px-6 pb-[max(300px,31vw)] pt-16 md:pt-20">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo className="h-5 text-ink" />
            <p className="mt-4 max-w-xs font-serif text-lg leading-snug text-ink-soft">
              A diary for the year between this birthday and the next.
            </p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="font-display text-lg font-semibold">{c.title}</h3>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl flex-col gap-1 px-6 pb-7 text-sm text-white/90 [text-shadow:0_1px_8px_rgba(40,60,20,0.5)] sm:flex-row sm:items-end sm:justify-between">
          <p className="font-hand text-2xl text-white">handwritten for people who want to make their year count.</p>
          <p>© {new Date().getFullYear()} LockedIn</p>
        </div>
      </div>
    </footer>
  );
}
