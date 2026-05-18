import React from "react";
import { Link } from "react-router-dom";

import greatHall from "../assets/GreatHall.png";

import blackGirlCoffee from "../assets/blackgirlcoffee.png";
import whiteGirlCoffee from "../assets/whitegirlcoffee.png";
import indianGuy from "../assets/indianguy.png";

import jeanGirlCoffee from "../assets/jeangirlcoffee.png";
import laptopWalkGirl from "../assets/laptopwalk.png";
import redShirtGirl from "../assets/redshirtgirl.png";
import textbooksImage from "../assets/Textbooks.png";
import techImage from "../assets/tech.png";
import appliancesImage from "../assets/appliances.png";
import clothesImage from "../assets/clothes.png";
import studyImage from "../assets/study.png";
import homeCookImage from "../assets/homecook.png";

function CampusPreview() {
  return (
    <main className="bg-white">
      {/* Full-screen Great Hall hero */}
      <section className="relative min-h-screen w-full overflow-hidden bg-slate-950">
        <header className="absolute left-0 top-0 z-50 w-full px-8 pt-5">
          <nav
            className="mx-auto flex max-w-7xl items-center justify-between rounded-[22px] border border-white/60 bg-white/70 px-7 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl"
            aria-label="Main navigation"
          >
            <Link
              to="/"
              className="text-xl font-black tracking-tight text-slate-950"
              aria-label="UniSquare home"
            >
              Uni
              <strong className="font-black text-blue-600">Square</strong>
            </Link>

            <ul className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
              <li>
                <Link
                  to="/"
                  className="relative text-blue-600 transition hover:text-blue-700 after:absolute after:-bottom-4 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-blue-600"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link to="/" className="transition hover:text-blue-600">
                  About
                </Link>
              </li>
            </ul>

            <menu className="flex list-none items-center gap-2 p-0">
              <li>
                <Link
                  to="/signin"
                  className="hidden rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-sm font-bold text-slate-800 transition hover:bg-white md:inline-flex"
                >
                  Sign In
                </Link>
              </li>

              <li>
                <Link
                  to="/signup"
                  className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(21,93,252,0.25)] transition hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </li>
            </menu>
          </nav>
        </header>

        <section
          className="relative flex min-h-screen items-center justify-end px-20 pb-10 pt-28"
          aria-label="Campus preview hero"
        >
          <img
            src={greatHall}
            alt="Wits Great Hall campus building"
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />

          <section
            className="absolute inset-0 z-10 bg-gradient-to-r from-black/10 via-white/10 to-white/80"
            aria-hidden="true"
          />

          <section
            className="pointer-events-none absolute inset-0 z-20"
            aria-label="Background student movement"
          >
            <img
              src={blackGirlCoffee}
              alt=""
              className="absolute bottom-[18px] left-[6%] h-[300px] select-none opacity-95 animate-gentle-step"
            />

            <img
              src={whiteGirlCoffee}
              alt=""
              className="absolute bottom-[18px] left-[36%] h-[285px] select-none opacity-90 animate-small-walk"
            />

            <img
              src={indianGuy}
              alt=""
              className="absolute bottom-[-95px] left-[-16%] h-[390px] select-none opacity-95 animate-indian-walk"
            />
          </section>

          <section
            className="pointer-events-none absolute inset-0 z-[25]"
            aria-label="Foreground student movement"
          >
            <img
              src={jeanGirlCoffee}
              alt=""
              className="absolute bottom-[-16px] left-[20%] h-[470px] select-none blur-[0.15px] animate-front-step"
            />

            <img
              src={laptopWalkGirl}
              alt=""
              className="absolute bottom-[-20px] left-[-2%] h-[495px] select-none blur-[0.15px] animate-front-walk"
            />

            <img
              src={redShirtGirl}
              alt=""
              className="absolute bottom-[-18px] left-[40%] h-[500px] select-none blur-[0.15px] animate-front-step-reverse"
            />
          </section>

          <article className="relative z-30 w-full max-w-[480px] rounded-[32px] bg-white/90 p-10 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Exclusive to Wits Students
            </p>

            <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-1.5px] text-slate-950">
              Discover, Buy, Sell & Connect —{" "}
              <em className="not-italic text-blue-600">Right On Your Campus</em>
            </h1>

            <p className="mt-6 text-base leading-7 text-slate-600">
              A refined student marketplace where verified Wits students can
              trade essentials, find deals, and connect safely.
            </p>
          </article>
        </section>
      </section>

      {/* White marketplace categories section */}
      <section
        className="bg-gradient-to-b from-white via-slate-50 to-blue-50/40 px-8 py-20"
        aria-labelledby="marketplace-categories-heading"
      >
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 lg:grid-cols-[0.85fr_1.4fr]">
        
        <header className="pt-4">
            <h2
                id="marketplace-categories-heading"
                className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-1.8px] text-slate-950"
            >
                Browse the essentials students{" "}
                <em className="not-italic text-blue-600">actually</em> trade.
            </h2>

            <p className="mt-7 max-w-md text-lg leading-8 text-slate-600">
                From textbooks and electronics to room items and everyday finds,
                UniSquare keeps campus trading simple, verified, and
                student-focused.
            </p>

            <p className="mt-8 max-w-md text-base font-semibold leading-7 text-slate-500">
                Built for verified Wits students who want a safer, cleaner way to buy,
                sell, and connect on campus.
            </p>
        </header>

          <section
            id="categories"
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Marketplace categories"
          >
            <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <figure>
                <img
                    src={textbooksImage}
                    alt="Books on shelves"
                    className="h-28 w-full object-cover"
                />

                <figcaption className="p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    Academic Textbooks
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Save on required readings from students who just finished.
                  </p>
                </figcaption>
              </figure>
            </article>

            <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <figure>
                <img
                    src={techImage}
                    alt="Laptop and electronic study equipment"
                    className="h-28 w-full object-cover"
                />

                <figcaption className="p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    Tech & Electronics
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Laptops, chargers, calculators, and study gear.
                  </p>
                </figcaption>
              </figure>
            </article>

            <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <figure>
                <img
                    src={appliancesImage}
                    alt="Student apartment appliances and room essentials"
                    className="h-28 w-full object-cover"
                />

                <figcaption className="p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    Dorm & Apartment
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Furniture, storage, appliances, and room essentials.
                  </p>
                </figcaption>
              </figure>
            </article>

            <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <figure>
                <img
                    src={clothesImage}
                    alt="Clothing and everyday fashion items"
                    className="h-28 w-full object-cover"
                />

                <figcaption className="p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    Fashion & Everyday
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Clothing, bags, shoes, and daily campus items.
                  </p>
                </figcaption>
              </figure>
            </article>

            <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <figure>
                <img
                    src={studyImage}
                    alt="Study supplies and stationery"
                    className="h-28 w-full object-cover"
                />

                <figcaption className="p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    Study Essentials
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Notes, stationery, printers, and learning tools.
                  </p>
                </figcaption>
              </figure>
            </article>

            <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <figure>
                <img
                    src={homeCookImage}
                    alt="Kitchen and cooking essentials"
                    className="h-28 w-full object-cover"
                />

                <figcaption className="p-5">
                  <h3 className="text-base font-bold text-slate-950">
                    Home & Kitchen
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Cookware, utensils, appliances, and home must-haves.
                  </p>
                </figcaption>
              </figure>
            </article>
          </section>
        </section>

      </section>

      <style>
        {`
          @keyframes gentleStep {
            0%, 100% {
              transform: translateX(0);
            }

            50% {
              transform: translateX(14px);
            }
          }

          @keyframes indianWalk {
            0%, 100% {
              transform: translateX(0);
            }

            50% {
              transform: translateX(10px);
            }
          }

          @keyframes smallWalk {
            0%, 100% {
              transform: translateX(0);
            }

            50% {
              transform: translateX(-14px);
            }
          }

          @keyframes frontStep {
            0%, 100% {
              transform: translateX(0);
            }

            50% {
              transform: translateX(8px);
            }
          }

          @keyframes frontStepReverse {
            0%, 100% {
              transform: translateX(0);
            }

            50% {
              transform: translateX(-8px);
            }
          }

          @keyframes frontWalk {
            0%, 100% {
              transform: translateX(0);
            }

            50% {
              transform: translateX(8px);
            }
          }

          .animate-gentle-step {
            animation: gentleStep 4.5s ease-in-out infinite;
          }

          .animate-indian-walk {
            animation: indianWalk 4.8s ease-in-out infinite;
          }

          .animate-small-walk {
            animation: smallWalk 5s ease-in-out infinite;
          }

          .animate-front-step {
            animation: frontStep 5s ease-in-out infinite;
          }

          .animate-front-step-reverse {
            animation: frontStepReverse 5.5s ease-in-out infinite;
          }

          .animate-front-walk {
            animation: frontWalk 4.8s ease-in-out infinite;
          }

          @media (max-width: 900px) {
            header {
              padding-inline: 1rem;
            }

            nav {
              padding-inline: 1.25rem;
            }

            section[aria-label="Campus preview hero"] {
              justify-content: center;
              padding-inline: 1.5rem;
              padding-bottom: 3rem;
            }

            article {
              padding: 2rem;
            }

            article h1 {
              font-size: 2.2rem;
            }

            section[aria-label="Foreground student movement"] img {
              height: 330px;
            }

            section[aria-label="Background student movement"] img {
              height: 230px;
            }
          }
        `}
      </style>
    </main>
  );
}

export default CampusPreview;