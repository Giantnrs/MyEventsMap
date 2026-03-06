import { Event } from "../../types";
import React from "react";
// 1. This is your "Fake" Database for now
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: "Hamilton Tech Meetup",
    description: "A gathering for local developers to discuss React and Next.js.",
    location: "Hamilton Central, NZ",
    date: "2026-03-15",
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    lat: 0,
    lng: 0,
    time: "",
    link: ""
  },
  {
    id: '2',
    title: "Riverside Night Market",
    description: "Local food trucks and live music by the Waikato River.",
    location: "Victoria St, Hamilton",
    date: "2026-03-20",
    category: "Food",
    imageUrl: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80",
    lat: 0,
    lng: 0,
    time: "",
    link: ""
  }
];

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Discover Local Events</h1>
        
        {/* 2. The Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_EVENTS.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {event.category}
                </span>
                <h2 className="text-xl font-bold mt-2 text-gray-800">{event.title}</h2>
                <p className="text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span>📍 {event.location}</span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <span>📅 {event.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}