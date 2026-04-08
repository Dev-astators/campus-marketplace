const CATEGORIES = [
  {
    id: "textbooks",
    title: "Academic Textbooks",
    description: "Save up to 70% on this semester's required reading from students who just finished.",
    // Bento layout: top-left large card
    gridClass: "col-span-2 row-span-1",
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&q=80",
    imagePosition: "object-center",
    overlayClass: "bg-gradient-to-r from-[#1a3a3a]/90 via-[#1a3a3a]/60 to-transparent",
  },
  {
    id: "tech",
    title: "Tech & Electronics",
    description: "Certified gear for your digital workflow.",
    // Bento layout: top-right card
    gridClass: "col-span-1 row-span-1",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&q=80",
    imagePosition: "object-center",
    overlayClass: "bg-gradient-to-br from-[#0d1f2d]/80 via-[#0d1f2d]/60 to-transparent",
  },
  {
    id: "dorm",
    title: "Clothing & Dorm Essentials",
    description: null,
    // Bento layout: bottom-left small card
    gridClass: "col-span-1 row-span-1",
    imageUrl: "https://tse4.mm.bing.net/th/id/OIP.VHU4Gq5KHcx4OBY49_SExQHaLG?rs=1&pid=ImgDetMain&o=7&rm=3",
    imagePosition: "object-top",
    overlayClass: "bg-gradient-to-t from-[#0d1f2d]/90 via-[#0d1f2d]/40 to-transparent",
  },
  {
    id: "furniture",
    title: "Premium Furniture",
    description: null,
    // Bento layout: bottom-right large card
    gridClass: "col-span-2 row-span-1",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80",
    imagePosition: "object-center",
    overlayClass: "bg-gradient-to-r from-[#1a3a3a]/80 via-[#1a3a3a]/50 to-transparent",
  },
];

function CategoryCard({ title, description, imageUrl, imagePosition, overlayClass, gridClass }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${gridClass}`}
      style={{ minHeight: "260px" }}
    >
      {/* Background image */}
      <img
        src={imageUrl}
        alt={title}
        className={`absolute inset-0 w-full h-full object-cover ${imagePosition} transition-transform duration-500 group-hover:scale-105`}
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 ${overlayClass}`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-7">
        <h3 className="text-white font-['inter',sans-serif] font-bold text-2xl leading-tight mb-1">{title}</h3>
        {description && (
          <p className="text-white/70 font-['inter',sans-serif] text-sm leading-relaxed mb-4 max-w-xs">{description}</p>
        )}
        {!description && <div className="mb-4" />}

      </div>
    </div>
  );
}

export default function CuratedCategories() {
  return (
    <section className="bg-blue-500 px-10 py-16 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-4xl font-['inter',sans-serif] font-bold text-white">
            Curated Categories
          </h2>
          <p className="text-white font-['inter',sans-serif] text-sm mt-1">
            Quality items, hand-picked for the academic lifestyle.
          </p>
        </div>
      </div>

      {/* Bento Grid: 3 columns, 2 rows */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} {...cat} />
        ))}
      </div>
    </section>
  );
}