// src/pages/StudentDashboard.jsx

/**
 * StudentDashboard page
 * Bundles Navbar, Sidebar, CategoryFilter and ListingsGrid.
 *
 * In production, replace MOCK_USER and MOCK_LISTINGS with
 * real data from your Supabase hooks / API calls.
 */

import { useState } from 'react';
import Navbar from '../components/Studentdashboard/Navbar';
import Sidebar from '../components/Studentdashboard/Sidebar';
import CategoryFilter from '../components/Studentdashboard/CategoryFilter';
import ListingsGrid from '../components/Studentdashboard/ListingsGrid';

// ── Mock data (replace with real API data in production) ──────────────────────

const MOCK_USER = {
  name: 'Nkosinathi Khumalo',
  avatarUrl: null,
};

const CATEGORIES = ['All Categories', 'Textbooks', 'Electronics', 'Furniture', 'Clothing'];

const MOCK_LISTINGS = [
  { id: '1', title: 'Computer Science Textbook', price: 200, condition: 'Good', category: 'Textbooks', imageUrl: null },
  { id: '2', title: 'Introduction to Algorithms', price: 150, condition: 'Like New', category: 'Textbooks', imageUrl: null },
  { id: '3', title: 'MacBook Pro 14"', price: 12000, condition: 'Good', category: 'Electronics', imageUrl: null },
  { id: '4', title: 'Wits Hoodie', price: 350, condition: 'New', category: 'Clothing', imageUrl: null },
  { id: '5', title: 'Data Structures Notes', price: 80, condition: 'Fair', category: 'Textbooks', imageUrl: null },
  { id: '6', title: 'Desk Lamp', price: 120, condition: 'Good', category: 'Furniture', imageUrl: null },
  { id: '7', title: 'ASUS VivoBook Laptop', price: 7500, condition: 'Like New', category: 'Electronics', imageUrl: null },
  { id: '8', title: 'Campus Jacket', price: 400, condition: 'New', category: 'Clothing', imageUrl: null },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const [activeNav, setActiveNav] = useState('marketplace');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // firstName derived from full name for the greeting
  const firstName = MOCK_USER.name.split(' ')[0];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Top navbar — full width */}
      <Navbar user={MOCK_USER} />

      {/* Body — sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">

          {/* Greeting */}
          <section aria-label="Welcome message">
            <h1 className="text-2xl font-bold text-gray-800">Hello, {firstName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Welcome Back!</p>
          </section>

          {/* Category filter */}
          <CategoryFilter
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Listings grid */}
          <ListingsGrid
            listings={MOCK_LISTINGS}
            loading={false}
          />

        </main>
      </div>
    </div>
  );
}
