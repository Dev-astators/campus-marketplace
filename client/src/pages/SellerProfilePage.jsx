// src/pages/SellerProfilePage.jsx

import Navbar from '../components/studentDashboard/Navbar';
import ListingsGrid from '../components/studentDashboard/ListingsGrid';

const MOCK_USER = {
  name: 'Nkosinathi Khumalo',
  avatarUrl: null,
};

const MOCK_SELLER = {
  id: 'seller-1',
  name: 'Mpho Murashiwa',
  avatarUrl: null,
  rating: 4.7,
  totalReviews: 23,
  email: '0000000@students.wits.ac.za',
  university: 'University of the Witwatersrand'
};

const MOCK_SELLER_LISTINGS = [
  {
    id: '1',
    title: 'Computer Science Textbook',
    price: 200,
    condition: 'Good',
    category: 'Textbooks',
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Desk Lamp',
    price: 120,
    condition: 'Good',
    category: 'Furniture',
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Campus Jacket',
    price: 400,
    condition: 'New',
    category: 'Clothing',
    imageUrl: null,
  },
];

export default function SellerProfilePage() {
  const initials = MOCK_SELLER.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <Navbar user={MOCK_USER} />

      <main className="flex-1 px-8 py-6 flex flex-col gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              {MOCK_SELLER.avatarUrl ? (
                <img
                  src={MOCK_SELLER.avatarUrl}
                  alt={MOCK_SELLER.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {MOCK_SELLER.name}
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    {MOCK_SELLER.email}
                </p>
                <p className="text-sm text-yellow-600 font-medium mt-1">
                    {MOCK_SELLER.rating} ({MOCK_SELLER.totalReviews} reviews)
                </p>


              </div>
            </div>

            <button className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              Message Seller
            </button>
          </div>

          
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Active Listings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Browse items currently being sold by this seller.
            </p>
          </div>

          <ListingsGrid listings={MOCK_SELLER_LISTINGS} loading={false} />
        </section>
      </main>
    </div>
  );
}