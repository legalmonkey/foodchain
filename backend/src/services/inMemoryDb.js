const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "FoodChain@2026!";
let passwordHash = "";

// In-Memory collections
const db = {
  users: [],
  restaurants: [],
  menuItems: [],
  orders: [],
  complaintCaches: [],
  jurorVotes: [],
};

const SEED_RESTAURANTS = [
  {
    _id: "res_truffles_01",
    name: "Truffles Gourmet Burgers",
    cuisine: ["American", "Burgers", "Fast Food"],
    address: "St. Marks Road, Central District",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop",
    menu: [
      { _id: "m_truffles_1", name: "All American Cheese Burger", description: "Juicy handcrafted patty with molten aged cheddar and gherkins", price: 280, category: "Burgers", isVeg: false },
      { _id: "m_truffles_2", name: "Crispy Peri-Peri Chicken Burger", description: "Fried spicy chicken breast with smoked peri-peri mayo", price: 295, category: "Burgers", isVeg: false },
      { _id: "m_truffles_3", name: "Truffle Mushroom Swiss Burger", description: "Sautéed button mushrooms, swiss cheese, truffle garlic emulsion", price: 310, category: "Burgers", isVeg: true },
      { _id: "m_truffles_4", name: "Loaded Cheese Fries", description: "Crispy skin-on potato fries bathed in jalapeño cheddar sauce", price: 180, category: "Sides", isVeg: true },
      { _id: "m_truffles_5", name: "Belgian Dark Chocolate Shake", description: "Rich Dutch chocolate gelato whipped with creamy whole milk", price: 210, category: "Beverages", isVeg: true },
    ],
  },
  {
    _id: "res_meghana_02",
    name: "Meghana Biryani House",
    cuisine: ["Biryani", "Andhra", "South Indian"],
    address: "Koramangala 5th Block, Tech Corridor",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop",
    menu: [
      { _id: "m_meghana_1", name: "Meghana Special Chicken Biryani", description: "Signature spicy boneless chicken gravy served over layered aromatic basmati", price: 340, category: "Biryani", isVeg: false },
      { _id: "m_meghana_2", name: "Andhra Mutton Dum Biryani", description: "Tender lamb cuts slow-cooked with Andhra whole spices and herbs", price: 420, category: "Biryani", isVeg: false },
      { _id: "m_meghana_3", name: "Paneer Hyderabadi Dum Biryani", description: "Marinated cottage cheese layered with saffron scented long-grain rice", price: 290, category: "Biryani", isVeg: true },
      { _id: "m_meghana_4", name: "Chicken 65 Spicy Starter", description: "Crispy fried curry-leaf spiced chicken morsels", price: 260, category: "Starters", isVeg: false },
      { _id: "m_meghana_5", name: "Lemon Soda Sweet & Salt", description: "Freshly squeezed lemon with carbonated soda water", price: 80, category: "Beverages", isVeg: true },
    ],
  },
  {
    _id: "res_napoli_03",
    name: "Pizza Napoli Trattoria",
    cuisine: ["Italian", "Pizza", "Pastas"],
    address: "Indiranagar 100ft Road",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop",
    menu: [
      { _id: "m_napoli_1", name: "Classic Margherita D.O.P", description: "San Marzano tomato base, fresh buffalo mozzarella, fragrant basil leaves", price: 420, category: "Pizza", isVeg: true },
      { _id: "m_napoli_2", name: "Pepperoni & Hot Honey Pizza", description: "Smoked spicy pork pepperoni slices drizzled with habanero-infused honey", price: 560, category: "Pizza", isVeg: false },
      { _id: "m_napoli_3", name: "Quattro Formaggi Pizza", description: "Mozzarella, gorgonzola, parmesan reggiano, and creamy fontina cheese", price: 490, category: "Pizza", isVeg: true },
      { _id: "m_napoli_4", name: "Penne Alfredo al Funghi", description: "Penne tossed in decadent cream, cracked black pepper, and shiitake mushrooms", price: 380, category: "Pasta", isVeg: true },
      { _id: "m_napoli_5", name: "Classic Tiramisu", description: "Espresso-soaked savoiardi biscuits layered with sweet mascarpone cream", price: 260, category: "Dessert", isVeg: true },
    ],
  },
  {
    _id: "res_wok_04",
    name: "Wok of Asia",
    cuisine: ["Pan-Asian", "Chinese", "Thai"],
    address: "HSR Layout Sector 3",
    imageUrl: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop",
    menu: [
      { _id: "m_wok_1", name: "Steamed Dim Sum Platter", description: "Assorted prawn and wild mushroom crystal dumplings with chili oil", price: 320, category: "Starters", isVeg: false },
      { _id: "m_wok_2", name: "Thai Green Curry with Jasmine Rice", description: "Aromatic lemongrass & galangal coconut curry with fresh Asian greens", price: 390, category: "Mains", isVeg: true },
      { _id: "m_wok_3", name: "Hakka Chili Garlic Noodles", description: "Wok-tossed hand-pulled noodles with charred garlic and scallions", price: 260, category: "Noodles", isVeg: true },
      { _id: "m_wok_4", name: "Kung Pao Crispy Chicken", description: "Tender chicken cubes with Sichuan peppercorns, dried chilies, and peanuts", price: 340, category: "Mains", isVeg: false },
      { _id: "m_wok_5", name: "Honey Darsaan with Vanilla Gelato", description: "Crispy fried wonton noodles glazed in wildflower honey with vanilla bean ice cream", price: 210, category: "Dessert", isVeg: true },
    ],
  },
  {
    _id: "res_subah_05",
    name: "Subah South Tiffins",
    cuisine: ["South Indian", "Breakfast", "Filter Coffee"],
    address: "Malleshwaram 7th Cross",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop",
    menu: [
      { _id: "m_subah_1", name: "Ghee Roast Masala Dosa", description: "Crispy golden crepe roasted in pure desi ghee stuffed with spiced potato mash", price: 130, category: "Dosas", isVeg: true },
      { _id: "m_subah_2", name: "Thatte Idli with Vada Combo", description: "Steamed fluffy rice cake and crunchy medu vada served with three chutneys", price: 110, category: "Tiffins", isVeg: true },
      { _id: "m_subah_3", name: "Mysore Onion Rava Dosa", description: "Semolina crepe speckled with chopped red onions, green chilies, and cumin", price: 145, category: "Dosas", isVeg: true },
      { _id: "m_subah_4", name: "Degree Filter Kaapi", description: "Authentic chicory-blend South Indian decoction frothed with full-cream milk", price: 60, category: "Beverages", isVeg: true },
    ],
  },
];

function initSeed() {
  passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 8);

  // Seed Users
  db.users = [
    {
      _id: "usr_cust_01",
      walletAddress: "0x1111111111111111111111111111111111111111",
      role: "customer",
      name: "Rahul Sharma",
      phone: "+91-9876543210",
      passwordHash,
      isJuror: false,
      jurorStake: "0",
    },
    {
      _id: "usr_del_01",
      walletAddress: "0x2222222222222222222222222222222222222222",
      role: "delivery_partner",
      name: "Vikram Singh",
      phone: "+91-9876543211",
      passwordHash,
      isJuror: false,
      jurorStake: "0",
    },
    {
      _id: "usr_admin_01",
      walletAddress: "0x3333333333333333333333333333333333333333",
      role: "admin",
      name: "Platform Administrator",
      phone: "+91-9876543212",
      passwordHash,
      isJuror: false,
      jurorStake: "0",
    },
  ];

  // 5 Jurors
  for (let i = 1; i <= 5; i++) {
    db.users.push({
      _id: `usr_juror_0${i}`,
      walletAddress: `0x777777777777777777777777777777777777777${i}`,
      role: "customer",
      name: `Juror Panelist #${i}`,
      phone: `+91-987654322${i}`,
      passwordHash,
      isJuror: true,
      jurorStake: "10000000000000000", // 0.01 POL
    });
  }

  // Seed Restaurants and Menu Items
  SEED_RESTAURANTS.forEach((r, idx) => {
    const ownerWallet = `0x555555555555555555555555555555555555550${idx + 1}`;
    const ownerId = `usr_rest_0${idx + 1}`;

    db.users.push({
      _id: ownerId,
      walletAddress: ownerWallet,
      role: "restaurant",
      name: `${r.name} Manager`,
      phone: `+91-987654323${idx}`,
      passwordHash,
      isJuror: false,
      jurorStake: "0",
    });

    db.restaurants.push({
      _id: r._id,
      ownerUserId: ownerId,
      walletAddress: ownerWallet,
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      imageUrl: r.imageUrl,
      isOpen: true,
      reputationScore: 95 - idx * 2,
    });

    r.menu.forEach((m) => {
      db.menuItems.push({
        _id: m._id,
        restaurantId: r._id,
        name: m.name,
        description: m.description,
        price: m.price,
        category: m.category,
        isVeg: m.isVeg,
        imageUrl: r.imageUrl,
        isAvailable: true,
      });
    });
  });

  console.log("✓ In-Memory Document Store initialized with 5 restaurants, full menus, and system users.");
}

initSeed();

module.exports = db;
