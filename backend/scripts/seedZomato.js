const fs = require("fs");
const path = require("path");
const readline = require("readline");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../src/config/env");
const User = require("../src/models/User");
const Restaurant = require("../src/models/Restaurant");
const MenuItem = require("../src/models/MenuItem");
const Order = require("../src/models/Order");

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "FoodChain@2026!";

// Curated Kaggle Zomato Bangalore Dataset iconic restaurants & real menus
const KAGGLE_ZOMATO_RESTAURANTS = [
  {
    name: "Truffles",
    cuisine: ["Cafe", "American", "Burger", "Steak"],
    address: "St. Marks Road, Central Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop",
    menu: [
      { name: "All American Cheese Burger", description: "Beef/Chicken handcrafted patty with cheddar, caramelized onions", price: 280, category: "Burgers", isVeg: false },
      { name: "Peri Peri Chicken Burger", description: "Spicy peri peri rubbed breast with house special aioli", price: 295, category: "Burgers", isVeg: false },
      { name: "Mushroom Melt Burger", description: "Sautéed wild button mushrooms with melted Swiss cheese", price: 270, category: "Burgers", isVeg: true },
      { name: "Cheese Jalapeno Poppers", description: "Crispy fried crumb-coated molten cheese bites", price: 190, category: "Appetizers", isVeg: true },
      { name: "Ferrero Rocher Thick Shake", description: "Decadent hazelnut chocolate shake topped with crushed wafer", price: 230, category: "Beverages", isVeg: true },
    ],
  },
  {
    name: "Meghana Foods",
    cuisine: ["Biryani", "Andhra", "South Indian", "Seafood"],
    address: "Koramangala 5th Block, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop",
    menu: [
      { name: "Meghana Special Chicken Biryani", description: "Signature spicy boneless chicken gravy served over layered basmati rice", price: 340, category: "Biryani", isVeg: false },
      { name: "Andhra Mutton Biryani", description: "Slow-cooked tender lamb with traditional Andhra spices", price: 420, category: "Biryani", isVeg: false },
      { name: "Paneer Hyderabadi Biryani", description: "Spiced paneer cubes cooked in saffron scented dum rice", price: 290, category: "Biryani", isVeg: true },
      { name: "Chicken 65", description: "Crispy curry-leaf tempered spicy boneless chicken", price: 260, category: "Starters", isVeg: false },
      { name: "Chili Prawns Andhra Style", description: "Tiger prawns wok-tossed with spicy green chilies and curry leaves", price: 380, category: "Starters", isVeg: false },
    ],
  },
  {
    name: "Onesta",
    cuisine: ["Pizza", "Italian", "Desserts"],
    address: "Indiranagar 100 Feet Road, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop",
    menu: [
      { name: "Farmhouse Fresh Pizza", description: "Capsicum, diced tomato, button mushroom, sweet corn", price: 330, category: "Pizza", isVeg: true },
      { name: "Bacon & Sausage Sourdough Pizza", description: "Crispy bacon strips, chicken sausage, smoked gouda", price: 450, category: "Pizza", isVeg: false },
      { name: "Creamy Chicken Alfredo Pasta", description: "Rich parmesan cream sauce, herb-grilled chicken, penne", price: 310, category: "Pasta", isVeg: false },
      { name: "Walnut Chocolate Tart", description: "Crumbly butter pastry shell filled with dark Belgian ganache", price: 160, category: "Dessert", isVeg: true },
    ],
  },
  {
    name: "Empire Restaurant",
    cuisine: ["North Indian", "Mughlai", "Biryani", "Kebab"],
    address: "Church Street, Central Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop",
    menu: [
      { name: "Empire Butter Chicken", description: "Tandoori chicken simmered in rich buttery makhani gravy", price: 360, category: "Mains", isVeg: false },
      { name: "Coin Parotta (3 Pcs)", description: "Layered flaky Kerala style mini coin parottas", price: 90, category: "Breads", isVeg: true },
      { name: "Empire Special Ghee Rice with Dal", description: "Fragrant jeera rice tossed in desi ghee with tadka dal", price: 220, category: "Mains", isVeg: true },
      { name: "Chicken Tikka Kebab (6 Pcs)", description: "Boneless chicken marinated in spiced hung curd roasted in tandoor", price: 310, category: "Starters", isVeg: false },
    ],
  },
  {
    name: "Corner House Ice Cream",
    cuisine: ["Desserts", "Ice Cream"],
    address: "Residency Road, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop",
    menu: [
      { name: "Death By Chocolate (DBC)", description: "Layers of hot gooey chocolate cake, vanilla ice cream, hot chocolate fudge, roasted peanuts, and cream", price: 260, category: "Sundae", isVeg: true },
      { name: "Hot Butter Scotch Sundae", description: "Vanilla ice cream bathed in warm house-crafted butterscotch sauce and nuts", price: 190, category: "Sundae", isVeg: true },
      { name: "Trilogy Sundae", description: "Three distinct fruit and chocolate scoops on sponge cake", price: 220, category: "Sundae", isVeg: true },
    ],
  },
  {
    name: "Vidyarthi Bhavan",
    cuisine: ["South Indian", "Breakfast"],
    address: "Gandhi Bazaar, Basavanagudi, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop",
    menu: [
      { name: "VB Special Masala Dosa", description: "Crisp outside, spongy inside, roasted in clarified butter with potato saagu and chutney", price: 90, category: "Tiffins", isVeg: true },
      { name: "Rava Vada", description: "Deep-fried crispy semolina dumpling with green chili and ginger", price: 55, category: "Tiffins", isVeg: true },
      { name: "Poori Saagu (2 Pcs)", description: "Puffed deep-fried bread served with spiced mixed vegetable saagu", price: 85, category: "Tiffins", isVeg: true },
      { name: "Filter Coffee", description: "South Indian traditional filter chicory decoction", price: 40, category: "Beverages", isVeg: true },
    ],
  },
  {
    name: "Mainland China",
    cuisine: ["Chinese", "Asian", "Dim Sum"],
    address: "1st Cross, HAL 2nd Stage, Indiranagar",
    imageUrl: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop",
    menu: [
      { name: "Steamed Prawn Sui Mai", description: "Classic open-faced Cantonese dumplings with minced prawn and tobiko", price: 390, category: "Dim Sum", isVeg: false },
      { name: "Crispy Lotus Stem in Honey Chili", description: "Sliced lotus stem tossed with Sichuan chili flakes and scallions", price: 340, category: "Starters", isVeg: true },
      { name: "Chicken Cantonese Pan Fried Noodles", description: "Crispy pan-fried noodles blanketed in white egg-white gravy with chicken", price: 410, category: "Noodles", isVeg: false },
    ],
  },
  {
    name: "Brik Oven",
    cuisine: ["Pizza", "Italian", "Salads"],
    address: "Church Street, Shanthala Nagar, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop",
    menu: [
      { name: "The Big Cheese Sourdough Pizza", description: "San Marzano tomatoes, fresh fior di latte, ricotta, parmesan, and basil", price: 490, category: "Pizza", isVeg: true },
      { name: "Bird In Hand Chicken Pizza", description: "Smoked chicken breast, caramelized onions, mozzarella, rosemary oil", price: 550, category: "Pizza", isVeg: false },
      { name: "Burrata Salad", description: "Whole creamy burrata bulb with heirloom tomatoes and aged balsamic glaze", price: 380, category: "Salads", isVeg: true },
    ],
  },
  {
    name: "Leon Grill",
    cuisine: ["Fast Food", "Burger", "Wraps"],
    address: "Koramangala 7th Block, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop",
    menu: [
      { name: "Leon Peri Peri Jumbo Chicken Burger", description: "Double grilled peri peri chicken breasts with jalapeño salsa", price: 290, category: "Burgers", isVeg: false },
      { name: "Falafel Pitta Wrap", description: "Crispy chickpea falafel discs with garlic tahini and pickled cucumbers", price: 210, category: "Wraps", isVeg: true },
      { name: "Cheesy Crinkle Fries", description: "Golden crinkle-cut fries with warm cheddar cheese sauce", price: 150, category: "Sides", isVeg: true },
    ],
  },
  {
    name: "Chili's American Grill & Bar",
    cuisine: ["Tex-Mex", "Mexican", "American"],
    address: "Phoenix Marketcity, Whitefield, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
    menu: [
      { name: "Texas Cheese Fries", description: "Loaded with melted Monterey Jack, smoked bacon bits, jalapeños, ranch", price: 390, category: "Appetizers", isVeg: false },
      { name: "Smoked Chicken Quesadilla", description: "Grilled flour tortilla stuffed with marinated chicken and pico de gallo", price: 440, category: "Mains", isVeg: false },
      { name: "Molten Chocolate Lava Cake", description: "Warm chocolate cake with molten center topped with vanilla ice cream in a chocolate shell", price: 340, category: "Dessert", isVeg: true },
    ],
  },
  {
    name: "Nagarjuna",
    cuisine: ["Andhra", "Biryani", "South Indian"],
    address: "Residency Road, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop",
    menu: [
      { name: "Andhra Bhojanam (Meal)", description: "Unlimited traditional Andhra banana leaf meal with gunpowder, ghee, sambar, rasam", price: 280, category: "Meals", isVeg: true },
      { name: "Nagarjuna Chicken Roast", description: "Dry roasted bone-in chicken infused with roasted whole Andhra spices", price: 310, category: "Starters", isVeg: false },
      { name: "Mutton Sukka", description: "Tender boneless mutton tossed in browned onions and black pepper", price: 380, category: "Starters", isVeg: false },
    ],
  },
  {
    name: "CTR — Shri Sagar",
    cuisine: ["South Indian", "Breakfast", "Fast Food"],
    address: "Margosa Road, Malleshwaram, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop",
    menu: [
      { name: "Benne Masala Dosa", description: "Legendary butter masala dosa crisped to golden amber with spiced potato filling", price: 95, category: "Tiffins", isVeg: true },
      { name: "Mangalore Bajji (4 Pcs)", description: "Fluffy savory fritters made with maida, curd, and green chilies", price: 60, category: "Snacks", isVeg: true },
      { name: "Poori with Chana Masala", description: "Fluffy wheat pooris served with spicy chickpea curry", price: 90, category: "Tiffins", isVeg: true },
    ],
  },
];

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseKaggleCsv(csvPath, limit = 20) {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const header = parseCsvLine(lines[0]);
  const nameIdx = header.indexOf("name");
  const addressIdx = header.indexOf("address");
  const cuisinesIdx = header.indexOf("cuisines");
  const menuIdx = header.indexOf("menu_item");
  const dishesIdx = header.indexOf("dish_liked");
  const costIdx = header.indexOf("approx_cost(for two people)");

  if (nameIdx === -1) return null;

  const restaurantsMap = new Map();
  for (let i = 1; i < lines.length && restaurantsMap.size < limit; i++) {
    const row = parseCsvLine(lines[i]);
    const name = row[nameIdx];
    if (!name || restaurantsMap.has(name.toLowerCase())) continue;

    const address = addressIdx !== -1 && row[addressIdx] ? row[addressIdx] : "Bangalore, India";
    const cuisines = cuisinesIdx !== -1 && row[cuisinesIdx] ? row[cuisinesIdx].split(",").map((c) => c.trim()) : ["Multi-Cuisine"];
    const cost = costIdx !== -1 && row[costIdx] ? parseInt(row[costIdx].replace(/,/g, ""), 10) || 400 : 400;
    const avgPrice = Math.max(80, Math.round(cost / 3));

    let menu = [];
    if (menuIdx !== -1 && row[menuIdx] && row[menuIdx] !== "[]") {
      try {
        const rawItems = row[menuIdx].replace(/^\[|\]$/g, "").split("', '").map((s) => s.replace(/^'|'$/g, "").trim());
        menu = rawItems.filter(Boolean).slice(0, 6).map((dishName, idx) => ({
          name: dishName,
          description: `Authentic ${dishName} prepared fresh to order.`,
          price: avgPrice + (idx * 20 - 30),
          category: cuisines[0] || "Specialty",
          isVeg: !dishName.toLowerCase().includes("chicken") && !dishName.toLowerCase().includes("mutton") && !dishName.toLowerCase().includes("fish"),
        }));
      } catch (e) {}
    }

    if (menu.length === 0 && dishesIdx !== -1 && row[dishesIdx]) {
      const dishes = row[dishesIdx].split(",").map((d) => d.trim()).filter(Boolean);
      menu = dishes.slice(0, 6).map((dishName, idx) => ({
        name: dishName,
        description: `Popular customer favorite: ${dishName}`,
        price: avgPrice + (idx * 25 - 20),
        category: cuisines[0] || "Main",
        isVeg: !dishName.toLowerCase().includes("chicken") && !dishName.toLowerCase().includes("mutton") && !dishName.toLowerCase().includes("fish"),
      }));
    }

    if (menu.length === 0) {
      menu = [
        { name: `${name} Signature Special`, description: "Chef's signature combination platter", price: avgPrice + 50, category: "Special", isVeg: true },
        { name: "Crispy Appetizer Platter", description: "Seasoned crispy appetizers with dipping sauce", price: avgPrice - 30, category: "Starters", isVeg: true },
        { name: "Special Refreshing Beverage", description: "Cool refreshing signature drink", price: 90, category: "Beverages", isVeg: true },
      ];
    }

    restaurantsMap.set(name.toLowerCase(), {
      name,
      address,
      cuisine: cuisines,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
      menu,
    });
  }

  return Array.from(restaurantsMap.values());
}

async function seedKaggleZomato() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongoUri);
    console.log("✓ Connected to MongoDB");

    // Check if user provided an external Kaggle CSV
    const configuredCsvPath = process.env.ZOMATO_CSV_PATH || path.resolve(__dirname, "../data/zomato.csv");
    let restaurantsToSeed = KAGGLE_ZOMATO_RESTAURANTS;

    if (fs.existsSync(configuredCsvPath)) {
      console.log(`Found Kaggle Zomato CSV dataset at: ${configuredCsvPath}`);
      console.log("Parsing Kaggle CSV dataset...");
      const parsed = parseKaggleCsv(configuredCsvPath, 20);
      if (parsed && parsed.length > 0) {
        restaurantsToSeed = parsed;
        console.log(`✓ Parsed ${parsed.length} restaurants from Kaggle CSV`);
      } else {
        console.log("Could not extract restaurants from CSV; falling back to curated Kaggle dataset.");
      }
    } else {
      console.log("Using built-in Kaggle Zomato authentic dataset (12 iconic Bangalore restaurant franchises).");
    }

    // Clean existing records
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    console.log("✓ Cleared existing collections");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create standard demo accounts for all roles
    console.log("Creating role demo accounts...");
    await User.create({
      walletAddress: "0x1111111111111111111111111111111111111111",
      role: "customer",
      name: "Rahul Sharma (Customer)",
      phone: "+91-9876543210",
      passwordHash,
    });

    await User.create({
      walletAddress: "0x2222222222222222222222222222222222222222",
      role: "delivery_partner",
      name: "Vikram Singh (Delivery Partner)",
      phone: "+91-9876543211",
      passwordHash,
    });

    await User.create({
      walletAddress: "0x3333333333333333333333333333333333333333",
      role: "admin",
      name: "System Admin (God Mode)",
      phone: "+91-9876543212",
      passwordHash,
    });

    // 5 Jurors
    for (let i = 1; i <= 5; i++) {
      await User.create({
        walletAddress: `0x777777777777777777777777777777777777777${i}`,
        role: "customer",
        name: `Juror Panelist #${i}`,
        phone: `+91-987654322${i}`,
        passwordHash,
        isJuror: true,
      });
    }

    // Seed restaurants and menus
    console.log("Seeding Kaggle Zomato restaurants and dishes...");
    for (let i = 0; i < restaurantsToSeed.length; i++) {
      const r = restaurantsToSeed[i];
      const wallet = `0x55555555555555555555555555555555555555${(i + 1).toString().padStart(2, "0")}`;

      const owner = await User.create({
        walletAddress: wallet,
        role: "restaurant",
        name: `${r.name} Owner`,
        phone: `+91-98765432${(30 + i)}`,
        passwordHash,
      });

      const restaurant = await Restaurant.create({
        ownerUserId: owner._id,
        walletAddress: wallet,
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        imageUrl: r.imageUrl,
        isOpen: true,
        reputationScore: 70,
      });

      for (const item of r.menu) {
        await MenuItem.create({
          restaurantId: restaurant._id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          isVeg: item.isVeg,
          imageUrl: r.imageUrl,
          isAvailable: true,
        });
      }
    }

    console.log("====================================================");
    console.log(`✓ Successfully seeded ${restaurantsToSeed.length} Kaggle Zomato restaurants!`);
    console.log(`✓ Created demo accounts for Customer, Restaurant, Delivery, Jurors, and Admin.`);
    console.log(`🔑 Default Password for all accounts: ${DEFAULT_PASSWORD}`);
    console.log("====================================================");

    process.exit(0);
  } catch (err) {
    console.error("Zomato seeding error:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedKaggleZomato();
}

module.exports = { seedKaggleZomato, KAGGLE_ZOMATO_RESTAURANTS };
