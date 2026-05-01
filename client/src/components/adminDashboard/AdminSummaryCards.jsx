export default function AdminSummaryCards({ cards }) {
  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Admin summary"
    >
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="text-sm font-medium text-gray-500">{card.title}</p>
          <p className="mt-2 text-xl font-bold text-gray-800">{card.value}</p>
          <p className="mt-1 text-xs text-gray-400">{card.trend}</p>
        </article>
      ))}
    </section>
  );
}
