import greatHall from "../assets/GreatHall.png";

import blackGirlCoffee from "../assets/blackgirlcoffee.png";
import whiteGirlCoffee from "../assets/whitegirlcoffee.png";
import chineseguy from "../assets/chineseguy.png";

import jeanGirlCoffee from "../assets/jeangirlcoffee.png";
import laptopWalkGirl from "../assets/laptopwalk.png";
import redShirtGirl from "../assets/redshirtgirl.png";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <section
        className="relative flex min-h-screen items-center justify-end px-20 pb-10 pt-28"
        aria-label="UniSquare campus hero"
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
            src={chineseguy}
            alt=""
            className="absolute bottom-[-120px] left-[-16%] h-[390px] select-none opacity-95 animate-indian-walk"
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
            A refined student marketplace where verified Wits students can trade
            essentials, find deals, and connect safely.
          </p>
        </article>
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
            section[aria-label="UniSquare campus hero"] {
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
    </section>
  );
}