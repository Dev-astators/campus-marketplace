import { Link } from "react-router-dom";
import Navbar from "../components/NavBar.jsx";
import greatHall from "../assets/GreatHall.webp";
import textbooksImage from "../assets/Textbooks.png";
import techImage from "../assets/tech.png";
import appliancesImage from "../assets/appliances.png";

const HIGHLIGHTS = [
  {
    value: "Verified",
    label: "student access",
    description:
      "UniSquare is shaped around Wits student accounts so campus trading starts with a known community.",
  },
  {
    value: "Safer",
    label: "handoffs",
    description:
      "Facilities, collection slots, and staff verification help students meet through an organized exchange flow.",
  },
  {
    value: "Useful",
    label: "admin insight",
    description:
      "Moderation, reports, and analytics help the marketplace stay cleaner as activity grows.",
  },
];

const APP_FEATURES = [
  {
    title: "Buy and sell campus essentials",
    description:
      "Students can list textbooks, electronics, room items, fashion, and everyday goods without leaving the campus community.",
  },
  {
    title: "Choose a practical payment flow",
    description:
      "The app supports online payments and records cash shortfalls so buyers, sellers, and staff can track what still needs to happen.",
  },
  {
    title: "Book collection around facilities",
    description:
      "Drop-off and collection slots connect marketplace activity to physical exchange points instead of leaving handoffs vague.",
  },
  {
    title: "Keep marketplace quality visible",
    description:
      "Ratings, seller profiles, notifications, moderation queues, and analytics make the system easier to trust and improve.",
  },
];

const HANDOFF_STEPS = [
  "A seller creates a listing with condition, price, images, and details.",
  "A buyer purchases or reserves the item and chooses a collection slot.",
  "The seller drops the item at a managed facility for verification.",
  "Staff confirm the handoff status so both sides can see progress.",
];

const TEAM_AREAS = [
  {
    title: "Frontend experience",
    description:
      "Designing the student dashboard, listing views, notifications, and responsive screens students use every day.",
  },
  {
    title: "Marketplace workflows",
    description:
      "Building the buying, selling, booking, messaging, and rating flows that make each trade understandable.",
  },
  {
    title: "Admin and facility tools",
    description:
      "Creating moderation, facility settings, staff verification, and analytics reports for the people running the marketplace.",
  },
  {
    title: "Backend and data quality",
    description:
      "Connecting authentication, profiles, listings, transactions, reports, and role-based redirects into one coherent app.",
  },
];

const MARKETPLACE_EXAMPLES = [
  {
    title: "Academic materials",
    image: textbooksImage,
    alt: "Textbooks listed for student resale",
  },
  {
    title: "Tech and study gear",
    image: techImage,
    alt: "Laptop and electronic study equipment",
  },
  {
    title: "Room essentials",
    image: appliancesImage,
    alt: "Appliances and room items for student living",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section
          className="relative isolate flex min-h-[78vh] items-end overflow-hidden bg-slate-950 px-6 pb-16 pt-32 sm:px-8 lg:px-12"
          aria-labelledby="about-page-heading"
        >
          <img
            src={greatHall}
            alt="Wits Great Hall and campus lawns"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />

          <section
            className="absolute inset-0 -z-10 bg-slate-950/70"
            aria-hidden="true"
          />

          <article className="mx-auto w-full max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              About UniSquare
            </p>

            <h1
              id="about-page-heading"
              className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl"
            >
              A safer campus marketplace built for everyday student trade.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50">
              UniSquare helps verified Wits students discover useful items, sell
              what they no longer need, and complete exchanges through clearer
              payment, booking, facility, and staff workflows.
            </p>

            <nav className="mt-9" aria-label="About page sections">
              <ul className="flex list-none flex-wrap gap-3 p-0">
                <li>
                  <a
                    href="#what-we-do"
                    className="inline-flex rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950"
                  >
                    What we do
                  </a>
                </li>
                <li>
                  <a
                    href="#handoff-flow"
                    className="inline-flex rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950"
                  >
                    Handoff flow
                  </a>
                </li>
                <li>
                  <a
                    href="#developers"
                    className="inline-flex rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950"
                  >
                    Developers
                  </a>
                </li>
              </ul>
            </nav>
          </article>
        </section>

        <section className="px-6 py-12 sm:px-8 lg:px-12" aria-label="UniSquare highlights">
          <ul className="mx-auto grid max-w-6xl list-none gap-4 p-0 md:grid-cols-3">
            {HIGHLIGHTS.map((highlight) => (
              <li
                key={highlight.label}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <strong className="block text-3xl font-black text-blue-600">
                  {highlight.value}
                </strong>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  {highlight.label}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {highlight.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="what-we-do"
          className="px-6 py-14 sm:px-8 lg:px-12"
          aria-labelledby="what-we-do-heading"
        >
          <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                What the app does
              </p>
              <h2
                id="what-we-do-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl"
              >
                UniSquare turns informal student trading into a guided campus
                workflow.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                The app brings together listings, profiles, payments, bookings,
                collections, messages, notifications, and administrative tools
                so a student marketplace can run with less guesswork.
              </p>
            </header>

            <section
              className="grid gap-4 md:grid-cols-2"
              aria-label="UniSquare product capabilities"
            >
              {APP_FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </section>
          </section>
        </section>

        <section
          className="bg-white px-6 py-16 sm:px-8 lg:px-12"
          aria-labelledby="marketplace-examples-heading"
        >
          <section className="mx-auto max-w-6xl">
            <header className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Built for student life
              </p>
              <h2
                id="marketplace-examples-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl"
              >
                The marketplace focuses on items students actually need.
              </h2>
            </header>

            <ul className="mt-8 grid list-none gap-4 p-0 md:grid-cols-3">
              {MARKETPLACE_EXAMPLES.map((example) => (
                <li key={example.title}>
                  <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      src={example.image}
                      alt={example.alt}
                      className="h-44 w-full object-cover"
                    />
                    <figcaption className="p-5 text-sm font-bold text-slate-700">
                      {example.title}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section
          id="handoff-flow"
          className="px-6 py-16 sm:px-8 lg:px-12"
          aria-labelledby="handoff-flow-heading"
        >
          <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Safer exchange flow
              </p>
              <h2
                id="handoff-flow-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl"
              >
                Every handoff has a clearer trail.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                UniSquare is not just a list of adverts. It gives students,
                sellers, facility staff, and administrators a shared view of
                what has happened and what still needs attention.
              </p>
            </header>

            <ol className="grid list-decimal gap-4 pl-5">
              {HANDOFF_STEPS.map((step) => (
                <li
                  key={step}
                  className="rounded-lg border border-slate-200 bg-white p-5 pl-7 text-sm font-semibold leading-6 text-slate-700 shadow-sm marker:text-blue-600"
                >
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </section>

        <section
          id="developers"
          className="bg-slate-950 px-6 py-16 text-white sm:px-8 lg:px-12"
          aria-labelledby="developers-heading"
        >
          <section className="mx-auto max-w-6xl">
            <header className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                Developers
              </p>
              <h2
                id="developers-heading"
                className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl"
              >
                Built by Dev-astators.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-300">
                The development work covers the full product: student-facing
                marketplace screens, role-based dashboards, facility handoffs,
                admin reporting, authentication, and the data flows that connect
                them.
              </p>
            </header>

            <ul className="mt-9 grid list-none gap-4 p-0 md:grid-cols-2">
              {TEAM_AREAS.map((area) => (
                <li key={area.title}>
                  <article className="rounded-lg border border-white/10 bg-white/5 p-6">
                    <h3 className="text-lg font-bold text-white">
                      {area.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {area.description}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </main>
    </>
  );
}
