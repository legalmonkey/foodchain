import React, { useState } from 'react';
import { Search, MapPin, Star, Clock, ShieldCheck, Filter, ArrowUpDown, Award, ChevronRight, Check } from 'lucide-react';
import { KAGGLE_RESTAURANTS } from '../data/zomatoRestaurants';

export const RestaurantsPage = ({ onSelectRestaurant, initialSearch = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'deliveryTime' | 'cost' | 'trust'

  const allCuisines = ['All', 'Biryani', 'Burger', 'Pizza', 'South Indian', 'Italian', 'Chinese', 'Desserts', 'Fast Food'];

  const filteredRestaurants = KAGGLE_RESTAURANTS.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.menu.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCuisine =
      selectedCuisine === 'All' || r.cuisine.some((c) => c.toLowerCase() === selectedCuisine.toLowerCase());

    const matchesVeg = !vegOnly || r.menu.some((m) => m.isVeg);

    return matchesSearch && matchesCuisine && matchesVeg;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'trust') return b.reputationScore - a.reputationScore;
    if (sortBy === 'cost') return a.costForTwo - b.costForTwo;
    if (sortBy === 'deliveryTime') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
    return 0;
  });

  return (
    <div className="space-y-8 py-6">
      {/* Search and Filters Header */}
      <div className="bg-white border-2 border-brand-dark p-6 shadow-neo rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for restaurants, dishes (e.g. Truffles, Biryani, Pizza)..."
              className="w-full pl-11 pr-4 py-3 bg-brand-gray border-2 border-brand-dark rounded-lg text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-red transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Veg Only Toggle */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3.5 py-2.5 rounded-lg border-2 text-xs font-black transition-all flex items-center gap-2 ${
                vegOnly
                  ? 'bg-green-600 text-white border-brand-dark shadow-neo'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand-dark'
              }`}
            >
              <span className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm ${vegOnly ? 'border-white bg-white' : 'border-green-600'}`}>
                {vegOnly && <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>}
              </span>
              <span>PURE VEG</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-brand-gray border-2 border-brand-dark px-3 py-2 rounded-lg text-xs font-bold">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-dark" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="rating">Top Rated (4.0+)</option>
                <option value="trust">Highest Trust Score</option>
                <option value="deliveryTime">Fastest Delivery</option>
                <option value="cost">Cost: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {allCuisines.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCuisine === c
                  ? 'bg-brand-red text-white border-brand-dark shadow-neo-sm'
                  : 'bg-white text-brand-dark border-gray-300 hover:border-brand-dark'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count & Location Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-black text-brand-dark">
          <MapPin className="w-4 h-4 text-brand-red" />
          <span>Delivery in Bangalore (Central, Koramangala, Indiranagar, Malleshwaram)</span>
        </div>
        <span className="text-xs font-bold text-gray-500">
          Showing {filteredRestaurants.length} Restaurants
        </span>
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="bg-white border-2 border-brand-dark p-12 text-center rounded-xl shadow-neo space-y-3">
          <h3 className="text-xl font-black uppercase text-brand-dark">No restaurants match your search</h3>
          <p className="text-sm text-gray-600 font-medium">Try clearing your filters or searching for another dish.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCuisine('All');
              setVegOnly(false);
            }}
            className="neo-btn-primary text-xs py-2 px-4 mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((res) => (
            <div
              key={res._id}
              onClick={() => onSelectRestaurant(res)}
              className="bg-white border-2 border-brand-dark rounded-xl overflow-hidden shadow-neo hover:-translate-y-1 transition-all duration-150 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Food Image Banner */}
                <div className="relative h-48 w-full overflow-hidden border-b-2 border-brand-dark bg-gray-100">
                  <img
                    src={res.imageUrl}
                    alt={res.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Offer Badge */}
                  {res.offer && (
                    <div className="absolute bottom-2.5 left-2.5 bg-brand-red text-white text-[11px] font-black px-2.5 py-1 border border-black rounded shadow-neo-sm">
                      {res.offer}
                    </div>
                  )}
                  {/* Delivery Time Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-white border border-black text-brand-dark text-xs font-black px-2.5 py-0.5 rounded flex items-center gap-1 shadow-neo-sm">
                    <Clock className="w-3.5 h-3.5 text-brand-red" />
                    <span>{res.deliveryTime}</span>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-brand-dark group-hover:text-brand-red transition-colors">
                        {res.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-1">{res.tagline}</p>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="bg-green-700 text-white font-black text-xs px-2 py-1 rounded flex items-center gap-1 shrink-0 border border-black">
                      <span>{res.rating}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 font-semibold line-clamp-1">
                    {res.cuisine.join(', ')}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100 font-medium">
                    <span>{res.address}</span>
                    <span className="font-bold text-brand-dark">₹{res.costForTwo} for two</span>
                  </div>
                </div>
              </div>

              {/* On-Chain Trust Guarantee Footer */}
              <div className="px-4 py-3 bg-brand-grayLight border-t-2 border-brand-dark flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-brand-dark font-black">
                  <ShieldCheck className="w-4 h-4 text-brand-red" />
                  <span>Trust Score: {res.reputationScore}/100</span>
                </div>
                <span className="font-bold text-brand-red flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>View Menu</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
