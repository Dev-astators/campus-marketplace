// src/pages/StudentDashboard.jsx

import { useEffect, useState } from 'react';
import Navbar from '../components/studentDashboard/Navbar';
import Sidebar from '../components/studentDashboard/Sidebar';
import CategoryFilter from '../components/studentDashboard/CategoryFilter';
import ListingsGrid from '../components/studentDashboard/ListingsGrid';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['All Categories', 'Textbooks', 'Electronics', 'Furniture', 'Clothing'];

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState('marketplace');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [search, setSearch] = useState('');

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────
  // USER
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser({
          name: data.session.user.email,
          id: data.session.user.id
        });
      }
    };
    getUser();
  }, []);

  // ─────────────────────────────
  // LISTINGS
  const fetchListings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/listings`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // ─────────────────────────────
  // NAVIGATION HANDLER (🔥 THIS IS THE FIX)
  const handleNavigate = (item) => {
    setActiveNav(item);

    if (item === 'messages') {
      navigate('/messages');   // ✅ THIS MAKES IT WORK
    }
  };

  // ─────────────────────────────
  const filteredListings = listings
    .filter(l =>
      selectedCategory === 'All Categories' ||
      l.category === selectedCategory
    )
    .filter(l =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );

  const firstName = user?.name?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      <Navbar user={user} onSearch={setSearch} />

      <div className="flex flex-1 overflow-hidden">

        {/* 🔥 IMPORTANT FIX HERE */}
        <Sidebar
          activeItem={activeNav}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

          <section>
            <h1 className="text-2xl font-bold text-gray-800">
              Hello, {firstName}
            </h1>
            <p className="text-sm text-gray-400">Welcome Back!</p>
          </section>

          <button
            onClick={() => navigate('/create-listing')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-fit"
          >
            + Create Listing
          </button>

          <CategoryFilter
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <ListingsGrid listings={filteredListings} loading={loading} />

        </main>
      </div>
    </div>
  );
}