const stageClasses = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  slate: "bg-slate-100 text-slate-700",
  green: "bg-green-50 text-green-700",
};

const LIFECYCLE_LABELS = [
  "Drop-off booked",
  "Collection booked",
  "Buyer arrived",
  "Cash confirmed",
  "Complete",
];

export default function TransactionFlowPanel({
  transactions,
  onAdvance,
  actionLoadingId = "",
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Transaction flow
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          End-to-end handoff queue
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Staff actions below move a transaction from accepted booking to
          completed collection, while keeping a visible trail of receipt and
          release confirmations.
        </p>
      </header>

      {transactions.length > 0 ? (
        <ol className="space-y-4 px-6 py-5">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <article className="rounded-2xl border border-slate-200 p-5">
                <header className="border-b border-slate-100 pb-4">
                  <p
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stageClasses[transaction.stageTone]}`}
                  >
                    {transaction.stageLabel}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">
                    {transaction.item}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {transaction.id} at {transaction.location}
                  </p>
                </header>

                <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <article className="rounded-2xl bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Transaction details
                    </h4>
                    <dl className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                      <section>
                        <dt className="font-semibold text-slate-900">Seller</dt>
                        <dd className="mt-1">{transaction.seller}</dd>
                      </section>
                      <section>
                        <dt className="font-semibold text-slate-900">Buyer</dt>
                        <dd className="mt-1">{transaction.buyer}</dd>
                      </section>
                      <section>
                        <dt className="font-semibold text-slate-900">
                          Amount
                        </dt>
                        <dd className="mt-1">{transaction.priceDisplay}</dd>
                      </section>
                      <section>
                        <dt className="font-semibold text-slate-900">
                          Category
                        </dt>
                        <dd className="mt-1">{transaction.category}</dd>
                      </section>
                      <section>
                        <dt className="font-semibold text-slate-900">
                          Drop-off slot
                        </dt>
                        <dd className="mt-1">{transaction.dropOffSlot}</dd>
                      </section>
                      <section>
                        <dt className="font-semibold text-slate-900">
                          Collection slot
                        </dt>
                        <dd className="mt-1">{transaction.collectionSlot}</dd>
                      </section>
                    </dl>
                  </article>

                  <article className="rounded-2xl bg-blue-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Lifecycle progress
                    </h4>
                    <progress
                      className="mt-3 block h-3 w-full"
                      max={transaction.progressMax}
                      value={transaction.progressValue}
                    />
                    <ol className="mt-4 space-y-2 text-sm text-slate-700">
                      {LIFECYCLE_LABELS.map((label, index) => {
                        const completed = index < transaction.progressValue;

                        return (
                          <li
                            key={`${transaction.id}-${label}`}
                            className={completed ? "font-medium text-slate-900" : ""}
                          >
                            {label}
                          </li>
                        );
                      })}
                    </ol>
                  </article>
                </section>

                <footer className="mt-5">
                  {transaction.actionLabel ? (
                    <button
                      type="button"
                      onClick={() => onAdvance(transaction.id, transaction.action)}
                      disabled={actionLoadingId === transaction.id}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {actionLoadingId === transaction.id
                        ? "Updating transaction..."
                        : transaction.actionLabel}
                    </button>
                  ) : (
                    <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      This transaction has been fully completed and archived.
                    </p>
                  )}
                </footer>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-6 py-5 text-sm text-slate-500">
          No booked facility transactions are available for staff action yet.
        </p>
      )}
    </article>
  );
}
