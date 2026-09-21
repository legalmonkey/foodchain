const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../src/config/env");
const User = require("../src/models/User");
const Restaurant = require("../src/models/Restaurant");
const MenuItem = require("../src/models/MenuItem");
const Order = require("../src/models/Order");

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "FoodChain@2026!";

// 15 realistic restaurants with authentic cuisines & menus
const SEED_RESTAURANTS = [
  {
    name: "Truffles Gourmet Burgers",
    cuisine: ["American", "Burgers", "Fast Food"],
    address: "St. Marks Road, Central District",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop",
    menu: [
      { name: "All American Cheese Burger", description: "Juicy handcrafted patty with molten aged cheddar and gherkins", price: 280, category: "Burgers", isVeg: false },
      { name: "Crispy Peri-Peri Chicken Burger", description: "Fried spicy chicken breast with smoked peri-peri mayo", price: 295, category: "Burgers", isVeg: false },
      { name: "Truffle Mushroom Swiss Burger", description: "Sautéed button mushrooms, swiss cheese, truffle garlic emulsion", price: 310, category: "Burgers", isVeg: true },
      { name: "Loaded Cheese Fries", description: "Crispy skin-on potato fries bathed in jalapeño cheddar sauce", price: 180, category: "Sides", isVeg: true },
      { name: "Belgian Dark Chocolate Shake", description: "Rich Dutch chocolate gelato whipped with creamy whole milk", price: 210, category: "Beverages", isVeg: true },
    ],
  },
  {
    name: "Meghana Biryani House",
    cuisine: ["Biryani", "Andhra", "South Indian"],
    address: "Koramangala 5th Block, Tech Corridor",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop",
    menu: [
      { name: "Meghana Special Chicken Biryani", description: "Signature spicy boneless chicken gravy served over layered aromatic basmati", price: 340, category: "Biryani", isVeg: false },
      { name: "Andhra Mutton Dum Biryani", description: "Tender lamb cuts slow-cooked with Andhra whole spices and herbs", price: 420, category: "Biryani", isVeg: false },
      { name: "Paneer Hyderabadi Dum Biryani", description: "Marinated cottage cheese layered with saffron scented long-grain rice", price: 290, category: "Biryani", isVeg: true },
      { name: "Chicken 65 Spicy Starter", description: "Crispy fried curry-leaf spiced chicken morsels", price: 260, category: "Starters", isVeg: false },
      { name: "Lemon Soda Sweet & Salt", description: "Freshly squeezed lemon with carbonated soda water", price: 80, category: "Beverages", isVeg: true },
    ],
  },
  {
    name: "Pizza Napoli Trattoria",
    cuisine: ["Italian", "Pizza", "Pastas"],
    address: "Indiranagar 100ft Road",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop",
    menu: [
      { name: "Classic Margherita D.O.P", description: "San Marzano tomato base, fresh buffalo mozzarella, fragrant basil leaves", price: 420, category: "Pizza", isVeg: true },
      { name: "Pepperoni & Hot Honey Pizza", description: "Smoked spicy pork pepperoni slices drizzled with habanero-infused honey", price: 560, category: "Pizza", isVeg: false },
      { name: "Quattro Formaggi Pizza", description: "Mozzarella, gorgonzola, parmesan reggiano, and creamy fontina cheese", price: 490, category: "Pizza", isVeg: true },
      { name: "Penne Alfredo al Funghi", description: "Penne tossed in decadent cream, cracked black pepper, and shiitake mushrooms", price: 380, category: "Pasta", isVeg: true },
      { name: "Classic Tiramisu", description: "Espresso-soaked savoiardi biscuits layered with sweet mascarpone cream", price: 260, category: "Dessert", isVeg: true },
    ],
  },
  {
    name: "Wok of Asia",
    cuisine: ["Pan-Asian", "Chinese", "Thai"],
    address: "HSR Layout Sector 3",
    imageUrl: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop",
    menu: [
      { name: "Steamed Dim Sum Platter", description: "Assorted prawn and wild mushroom crystal dumplings with chili oil", price: 320, category: "Starters", isVeg: false },
      { name: "Thai Green Curry with Jasmine Rice", description: "Aromatic lemongrass & galangal coconut curry with fresh Asian greens", price: 390, category: "Mains", isVeg: true },
      { name: "Hakka Chili Garlic Noodles", description: "Wok-tossed hand-pulled noodles with charred garlic and scallions", price: 260, category: "Noodles", isVeg: true },
      { name: "Kung Pao Crispy Chicken", description: "Tender chicken cubes with Sichuan peppercorns, dried chilies, and peanuts", price: 340, category: "Mains", isVeg: false },
      { name: "Honey Darsaan with Vanilla Gelato", description: "Crispy fried wonton noodles glazed in wildflower honey with vanilla bean ice cream", price: 210, category: "Dessert", isVeg: true },
    ],
  },
  {
    name: "Subah South Tiffins",
    cuisine: ["South Indian", "Breakfast", "Filter Coffee"],
    address: "Malleshwaram 7th Cross",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop",
    menu: [
      { name: "Ghee Roast Masala Dosa", description: "Crispy golden crepe roasted in pure desi ghee stuffed with spiced potato mash", price: 130, category: "Dosas", isVeg: true },
      { name: "Thatte Idli with Vada Combo", description: "Steamed fluffy rice cake and crunchy medu vada served with three chutneys", price: 110, category: "Tiffins", isVeg: true },
      { name: "Mysore Onion Rava Dosa", description: "Semolina crepe speckled with chopped red onions, green chilies, and cumin", price: 145, category: "Dosas", isVeg: true },
      { name: "Degree Filter Kaapi", description: "Authentic chicory-blend South Indian decoction frothed with full-cream milk", price: 60, category: "Beverages", isVeg: true },
    ],
  },
];

async function runSeed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(config.mongoUri);
    console.log("✓ Connected to MongoDB");

    // Clean old collections
    console.log("Cleaning old database collections...");
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create system roles test accounts
    console.log("Creating seed users for all roles...");
    const customerUser = await User.create({
      walletAddress: "0x1111111111111111111111111111111111111111",
      role: "customer",
      name: "Rahul Sharma (Customer)",
      phone: "+91-9876543210",
      passwordHash,
    });

    const deliveryPartnerUser = await User.create({
      walletAddress: "0x2222222222222222222222222222222222222222",
      role: "delivery_partner",
      name: "Vikram Singh (Delivery)",
      phone: "+91-9876543211",
      passwordHash,
    });

    const adminUser = await User.create({
      walletAddress: "0x3333333333333333333333333333333333333333",
      role: "admin",
      name: "System Admin (God Mode)",
      phone: "+91-9876543212",
      passwordHash,
    });

    // Create 5 Juror accounts
    const jurorUsers = [];
    for (let i = 1; i <= 5; i++) {
      const hex = i.toString().padStart(40, "0");
      const juror = await User.create({
        walletAddress: `0x777777777777777777777777777777777777777${i}`,
        role: "customer",
        name: `Juror Panelist #${i}`,
        phone: `+91-987654322${i}`,
        passwordHash,
        isJuror: true,
      });
      jurorUsers.push(juror);
    }

    console.log("Seeding restaurants and menu catalogs...");
    for (let idx = 0; idx < SEED_RESTAURANTS.length; idx++) {
      const rData = SEED_RESTAURANTS[idx];
      const restWallet = `0x444444444444444444444444444444444444444${idx + 1}`;

      const restOwner = await User.create({
        walletAddress: restWallet,
        role: "restaurant",
        name: `${rData.name} Manager`,
        phone: `+91-987654323${idx}`,
        passwordHash,
      });

      const restaurant = await Restaurant.create({
        ownerUserId: restOwner._id,
        walletAddress: restWallet,
        name: rData.name,
        cuisine: rData.cuisine,
        address: rData.address,
        imageUrl: rData.imageUrl,
        isOpen: true,
        reputationScore: 70,
      });

      for (const item of rData.menu) {
        await MenuItem.create({
          restaurantId: restaurant._id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          isVeg: item.isVeg,
          imageUrl: rData.imageUrl,
          isAvailable: true,
        });
      }
    }

    console.log("✓ Seeding complete!");
    console.log(`Default password for all seed accounts: ${DEFAULT_PASSWORD}`);
    console.log("Customer: 0x1111111111111111111111111111111111111111");
    console.log("Delivery: 0x2222222222222222222222222222222222222222");
    console.log("Admin:    0x3333333333333333333333333333333333333333");
    console.log("Jurors:   0x7777777777777777777777777777777777777771 to ...5");

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
