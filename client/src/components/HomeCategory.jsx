import textbooksImage from "../assets/Textbooks.png";
import techImage from "../assets/tech.png";
import appliancesImage from "../assets/appliances.png";
import clothesImage from "../assets/clothes.png";
import studyImage from "../assets/study.png";
import homeCookImage from "../assets/homecook.png";

const CATEGORIES = [
  {
    id: "textbooks",
    title: "Academic Textbooks",
    description: "Save on required readings from students who just finished.",
    image: textbooksImage,
    alt: "Academic textbooks and bookshelves",
  },
  {
    id: "tech",
    title: "Tech & Electronics",
    description: "Laptops, chargers, calculators, and study gear.",
    image: techImage,
    alt: "Laptop and electronic study equipment",
  },
  {
    id: "dorm",
    title: "Dorm & Apartment",
    description: "Furniture, storage, appliances, and room essentials.",
    image: appliancesImage,
    alt: "Student apartment appliances and room essentials",
  },
  {
    id: "fashion",
    title: "Fashion & Everyday",
    description: "Clothing, bags, shoes, and daily campus items.",
    image: clothesImage,
    alt: "Clothing and everyday fashion items",
  },
  {
    id: "study",
    title: "Study Essentials",
    description: "Notes, stationery, printers, and learning tools.",
    image: studyImage,
    alt: "Study supplies and stationery",
  },
  {
    id: "kitchen",
    title: "Home & Kitchen",
    description: "Cookware, utensils, appliances, and home must-haves.",
    image: homeCookImage,
    alt: "Kitchen and cooking essentials",
  },
];

function CategoryCard({ title, description, image, alt }) {
  return (
    <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.12)]">
      <figure>
        <img src={image} alt={alt} className="h-28 w-full object-cover" />

        <figcaption className="p-5">
          <h3 className="text-base font-bold text-slate-950">{title}</h3>

          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </figcaption>
      </figure>
    </article>
  );
}

export default function CuratedCategories() {
  return (
    <section
      className="bg-gradient-to-b from-white via-slate-50 to-blue-50/40 px-8 py-20"
      aria-labelledby="marketplace-categories-heading"
    >
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1.4fr]">
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
            Built for verified Wits students who want a safer, cleaner way to
            buy, sell, and connect on campus.
          </p>
        </header>

        <section
          id="categories"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Marketplace categories"
        >
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </section>
      </section>
    </section>
  );
}