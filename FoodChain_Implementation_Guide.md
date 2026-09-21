# FoodChain — Implementation & Build Guide
### A Blockchain-Based Complaint & Grievance Redressal System for a Food Delivery Platform

**Audience:** This document is written to be handed directly to a coding agent (e.g. Claude Code) as a build spec. It contains the full architecture, contract specs, API surface, data models, folder structure, and a phased build procedure. Follow it top to bottom; each phase produces a working, testable slice of the system.

**What this project is, in one paragraph:** A self-built, fully working 3-sided food delivery web app (Customer / Restaurant / Delivery Partner), styled like Swiggy/Zomato, where every order flows through realistic status transitions. If a customer is unhappy with food quality, delivery time, wrong items, or hygiene, they file a complaint with photo/video evidence. The evidence is pinned to real IPFS, and the complaint plus its resolution are written to real smart contracts on a public Ethereum-compatible testnet. Simple cases auto-resolve by rule; contested cases go to a **decentralized jury** — any registered user can stake test tokens to become a juror, vote on contested complaints, and be rewarded or slashed depending on whether they voted with the majority. Restaurant/delivery-partner reputation scores live on-chain and update automatically after every resolution.

---

## 0. Reality Check — What's Real vs Simulated

Be upfront about this in your report/viva — it's a strength of the design, not a weakness:

| Component | Status |
|---|---|
| Order placing, restaurant menus, delivery flow | **Simulated** — your own backend/DB, no Swiggy/Zomato API exists for this |
| Restaurant names/menus/cuisines | **Real data**, sourced from a public dataset (Kaggle Zomato dataset) or seeded manually |
| Smart contracts, gas fees, wallet signing | **Real** — deployed on a public testnet, real MetaMask transactions |
| Evidence storage | **Real** — actually pinned to IPFS via Pinata, retrievable by CID from anywhere |
| Complaint records & resolutions | **Real** — actually immutable on-chain, publicly verifiable on the testnet block explorer |
| Juror staking/voting/slashing | **Real mechanics**, simulated economic stakes (testnet tokens have no real value) |
| Hosting | **Real** — live URLs on free-tier hosting, not just localhost |

---

## 1. System Roles

| Role | Capabilities |
|---|---|
| **Customer** | Browse restaurants/menus, place orders, track order status live, file complaints with evidence, view complaint/resolution history |
| **Restaurant** | Manage menu, accept/reject incoming orders, mark preparing/ready, respond to complaints (accept fault or contest), view own reputation score |
| **Delivery Partner** | Accept delivery assignment, update status (picked up → out for delivery → delivered), respond to complaints, view own reputation score |
| **Juror** *(any registered user, opt-in)* | Stake test tokens to join the juror pool, vote on contested complaints assigned to them, earn/lose stake based on the majority outcome |
| **Admin** | God-mode dashboard: manually force any order's state (for demos), view all complaints/disputes, seed/manage restaurant data, emergency-resolve disputes if jury stalls |

---

## 2. High-Level Architecture

```
┌──────────────────────────── Frontend (React + Vite + Tailwind) ─────────────────────────────┐
│  Customer UI · Restaurant Dashboard · Delivery Dashboard · Juror Panel · Admin Panel          │
│  Wallet connect (MetaMask via ethers.js) · Socket.io client for live order status             │
└───────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                         │ REST + WebSocket
┌───────────────────────────────────────▼───────────────────────────────────────────────────────┐
│                        Backend (Node.js + Express + MongoDB + Socket.io)                       │
│  Auth (JWT, role-based) · Order state machine · Restaurant/menu CRUD · Complaint intake         │
│  Pinata SDK (IPFS pinning) · ethers.js (reads/writes to contracts, listens to events)           │
└───────────────┬───────────────────────────────────────────────────┬───────────────────────────┘
                │                                                    │
      ┌─────────▼─────────┐                              ┌───────────▼───────────┐
      │   MongoDB Atlas    │                              │   IPFS (via Pinata)    │
      │  users, restaurants,│                              │  complaint evidence    │
      │  orders, menu items │                              │  (photos/videos)       │
      └─────────────────────┘                              └────────────────────────┘
                                                                        │ CID referenced by
┌───────────────────────────────────────────────────────────────────▼───────────────────────────┐
│                  On-chain Layer — Polygon Amoy Testnet (Solidity contracts)                     │
│  UserRegistry · OrderRegistry · ComplaintRegistry · DisputeResolution (jury) · ReputationManager│
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Final Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Smart contracts | Solidity 0.8.x, Hardhat, OpenZeppelin | Industry standard, best tooling/docs |
| Blockchain network | **Polygon Amoy testnet** | Free faucet tokens, fast blocks (~2s), low friction for many juror-voting transactions during a demo |
| Wallet | MetaMask (browser extension) | Every role connects a wallet; free |
| IPFS pinning | Pinata (free tier: 1GB storage) | Simplest SDK, reliable free gateway |
| Backend | Node.js + Express | Fast to build, huge ecosystem |
| Database | MongoDB Atlas (free M0 cluster) | Free, no local install needed, works with live hosting |
| Real-time updates | Socket.io | Push order-status changes to the frontend live, matches your "semi-real with delays" requirement |
| Blockchain client (backend) | ethers.js v6 | Send transactions server-side (e.g. relaying) and listen for contract events |
| Frontend framework | React + Vite | Fast dev server, simple build |
| Styling | Tailwind CSS, hand-rolled neo-brutalist theme | Thick black borders, hard offset shadows, high-contrast blocks — distinct from generic Bootstrap look |
| Frontend Web3 | ethers.js + a lightweight wallet-connect hook | Direct control, no heavy dependency |
| Hosting — frontend | Vercel (free) | Zero-config React/Vite deploys |
| Hosting — backend | Render (free web service) | Free tier, easy env vars; note: free tier cold-starts after inactivity — mention this in the viva |
| RPC provider | Alchemy or Infura free tier (Amoy endpoint) | Needed to talk to the testnet from Hardhat and from the backend |

---

## 4. Accounts to Create Before Starting (all free)

1. **MetaMask** — browser extension wallet, create 6+ accounts (customer, restaurant, delivery, admin, and a couple of extra for juror testing).
2. **Polygon Amoy faucet** — get free test POL for each MetaMask account (search "Polygon Amoy faucet"; Alchemy and the official Polygon faucet both work).
3. **Alchemy** (alchemy.com) — free account, create an app on "Polygon Amoy" to get an RPC URL.
4. **Pinata** (pinata.cloud) — free account, generate an API Key + JWT for pinning files.
5. **MongoDB Atlas** (mongodb.com/atlas) — free M0 cluster, get a connection string.
6. **Vercel** and **Render** accounts (can sign up with GitHub) for deployment later.
7. **GitHub repo** — to connect Vercel/Render for auto-deploy.

---

## 5. Smart Contracts Specification

Five contracts, each single-responsibility. Use OpenZeppelin's `Ownable` for admin-gated functions and `ReentrancyGuard` where value moves.

### 5.1 `UserRegistry.sol`
Tracks wallet → role mapping and juror opt-in.
```solidity
enum Role { None, Customer, Restaurant, DeliveryPartner }

struct UserProfile {
    Role role;
    bool isJuror;
    uint256 jurorStake;
    bool isVerified;
}

mapping(address => UserProfile) public profiles;

function registerUser(Role role) external;
function becomeJuror() external payable;      // requires msg.value >= MIN_JUROR_STAKE
function exitJuror() external;                 // withdraw stake if not in an active case
function getRole(address user) external view returns (Role);
function isJuror(address user) external view returns (bool);
```
Constant: `MIN_JUROR_STAKE = 0.01 ether` (test POL — adjust freely, it's free money).

### 5.2 `OrderRegistry.sol`
Lightweight anchor for orders — full order details (items, price breakdown) stay off-chain in MongoDB; only what's needed for dispute integrity goes on-chain.
```solidity
struct OrderRef {
    string offChainOrderId;   // Mongo _id, links back to backend record
    address customer;
    address restaurant;
    address deliveryPartner;
    uint256 deliveredTimestamp;
    bool exists;
}

mapping(bytes32 => OrderRef) public orders; // keyed by keccak256(offChainOrderId)

function createOrderRef(string calldata offChainOrderId, address customer, address restaurant) external onlyBackend;
function assignDeliveryPartner(bytes32 orderKey, address partner) external onlyBackend;
function markDelivered(bytes32 orderKey) external onlyBackend;
```
`onlyBackend` = a single trusted relayer address (your backend's wallet) — document this as a deliberate centralization trade-off for a student project; a production version would have the customer/restaurant apps sign directly.

### 5.3 `ComplaintRegistry.sol`
```solidity
enum Category { FoodQuality, LateDelivery, WrongOrMissingItem, HygienePackaging, Behaviour }
enum Status { Filed, AutoResolved, Contested, InDispute, Resolved }

struct Complaint {
    bytes32 orderKey;
    address filer;
    address respondent;       // restaurant or delivery partner being complained about
    Category category;
    string evidenceCID;       // IPFS CID
    Status status;
    uint256 filedAt;
    bool verdictUpheld;       // final outcome once resolved
}

mapping(uint256 => Complaint) public complaints;
uint256 public complaintCount;

function fileComplaint(bytes32 orderKey, address respondent, Category category, string calldata evidenceCID) external returns (uint256 complaintId);
function respondentAccepts(uint256 complaintId) external;   // respondent admits fault -> auto-resolve
function respondentContests(uint256 complaintId) external;  // -> escalate to DisputeResolution
function getComplaint(uint256 complaintId) external view returns (Complaint memory);
```
Emits `ComplaintFiled`, `ComplaintAutoResolved`, `ComplaintContested`.

### 5.4 `DisputeResolution.sol` — the jury system
```solidity
enum Verdict { None, UpholdComplaint, RejectComplaint }

struct Case {
    uint256 complaintId;
    address[] jurors;                 // eligible jurors for this case
    mapping(address => Verdict) votes;
    uint256 upholdVotes;
    uint256 rejectVotes;
    uint256 votingDeadline;
    bool finalized;
}

uint256 public constant JURY_SIZE = 5;
uint256 public constant VOTING_WINDOW = 10 minutes; // shorten to 2 min in a "DEMO_MODE" constructor flag

function openCase(uint256 complaintId) external;         // called by ComplaintRegistry on contest; pseudo-randomly selects JURY_SIZE jurors from the registered pool (document the pseudo-randomness — e.g. blockhash-based — as insecure-but-fine-for-a-demo; note Chainlink VRF as the real-world fix)
function castVote(uint256 caseId, Verdict verdict) external;  // only eligible, not-yet-voted jurors
function finalizeCase(uint256 caseId) external;               // after deadline or all voted: tally, call ReputationManager, pay/slash jurors
function forceFinalize(uint256 caseId) external onlyOwner;    // admin escape hatch for demos
```
Slashing/reward logic: jurors who vote with the majority split a small reward pool (e.g. funded by a tiny platform fee simulated per order, or just refunded their stake + 10%); minority voters lose e.g. 50% of their stake back to the reward pool. Keep the arithmetic simple and clearly commented — this is the most "interesting" contract for your viva, so it should be readable, not clever.

### 5.5 `ReputationManager.sol`
```solidity
mapping(address => uint256) public scores; // 0-100, start everyone at 70

function updateScore(address subject, int256 delta) external onlyAuthorized; // called by ComplaintRegistry (auto-resolve) or DisputeResolution (verdict)
function getScore(address subject) external view returns (uint256);
```
Suggested deltas: complaint upheld against a party → −10 (floor 0); complaint rejected / dismissed → +2 for the respondent (cap 100).

---

## 6. Backend — Data Model (MongoDB / Mongoose)

- **User**: `{ walletAddress, role, name, phone, passwordHash, isJuror, createdAt }`
- **Restaurant**: `{ ownerUserId, name, cuisine, address, imageUrl, isOpen }`
- **MenuItem**: `{ restaurantId, name, price, imageUrl, category, isAvailable }`
- **Order**: `{ customerId, restaurantId, deliveryPartnerId, items: [{menuItemId, qty, price}], totalPrice, status, statusTimestamps: {placed, accepted, preparing, outForDelivery, delivered}, onChainOrderKey, createdAt }`
  - `status` enum: `PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED → CLOSED`
- **ComplaintCache**: mirrors on-chain complaint data for fast querying/filtering in the UI (source of truth is always the contract; this is a read cache kept in sync via event listeners) — `{ onChainComplaintId, orderId, filerId, respondentId, category, evidenceCID, status, filedAt, resolvedAt, verdictUpheld }`
- **JurorVoteCache**: `{ caseId, jurorAddress, verdict, votedAt }` (for UI display only)

---

## 7. Backend — REST API Surface

```
Auth
  POST   /api/auth/register        { role, name, walletAddress, password }
  POST   /api/auth/login           { walletAddress, password } -> JWT

Restaurants & Menu
  GET    /api/restaurants
  GET    /api/restaurants/:id
  POST   /api/restaurants/:id/menu        (restaurant role)
  PATCH  /api/restaurants/:id/menu/:itemId

Orders
  POST   /api/orders                       (customer) — place order
  GET    /api/orders/:id
  GET    /api/orders/mine                  (role-aware: customer/restaurant/delivery views)
  PATCH  /api/orders/:id/status            (restaurant/delivery/admin) — advance state
  POST   /api/orders/:id/assign-delivery   (system/admin)

Complaints
  POST   /api/complaints                   (customer) — multipart: evidence file + { orderId, category, description }
                                            -> uploads to Pinata -> calls fileComplaint() on-chain -> caches result
  GET    /api/complaints/:id
  GET    /api/complaints/mine
  POST   /api/complaints/:id/respond       (restaurant/delivery) — { action: "accept" | "contest" }

Jury
  POST   /api/juror/register               (any logged-in user) — prompts wallet tx to becomeJuror()
  GET    /api/juror/cases/assigned         (juror) — cases where caller is a selected juror
  POST   /api/juror/cases/:caseId/vote     — { verdict } -> prompts wallet tx to castVote()
  POST   /api/juror/cases/:caseId/finalize — anyone, after deadline

Admin
  GET    /api/admin/orders                 — all orders, any state
  PATCH  /api/admin/orders/:id/force-status
  GET    /api/admin/complaints             — all complaints/disputes
  POST   /api/admin/complaints/:id/force-finalize

Reputation
  GET    /api/reputation/:walletAddress
```

Note the pattern: **wallet-signed actions** (filing a complaint, voting, becoming a juror) should be initiated from the frontend with the user's own MetaMask wallet signing the transaction directly against the contract via ethers.js — the backend's role there is just to prepare data (e.g. upload evidence, get the CID) and cache the result after the event fires. **System actions** (order state anchoring) are relayed by the backend's own wallet since customers/restaurants shouldn't need to sign a transaction just to mark food as "preparing."

---

## 8. Order Lifecycle (semi-real + manual override, as requested)

Each state has a default auto-advance timer **and** a manual button for the responsible role (and always for Admin):

| State | Auto-advances after | Manual trigger available to |
|---|---|---|
| `PLACED` | 20s → `ACCEPTED` | Restaurant, Admin |
| `ACCEPTED` | 45s → `PREPARING` | Restaurant, Admin |
| `PREPARING` | 60s → `OUT_FOR_DELIVERY` (also assigns a delivery partner) | Restaurant, Delivery Partner, Admin |
| `OUT_FOR_DELIVERY` | 90s → `DELIVERED` | Delivery Partner, Admin |
| `DELIVERED` | — (opens complaint window, e.g. 24h in prod / 5 min in demo mode) | Admin can force-close early |

On reaching `DELIVERED`, the backend calls `OrderRegistry.markDelivered()` on-chain and emits a Socket.io event so the customer's UI immediately shows "Delivered — rate your order or file a complaint."

---

## 9. Complaint & Jury Flow (end-to-end)

1. Customer opens a delivered order → "File a Complaint" → picks category, writes a description, uploads a photo/video.
2. Backend uploads the file to Pinata → gets back a CID.
3. Frontend prompts the customer's MetaMask to sign `fileComplaint(orderKey, respondent, category, cid)`.
4. Respondent (restaurant or delivery partner) gets a notification (Socket.io + in-app) with a 48h-in-prod/2-min-in-demo response window: **Accept fault** (auto-resolve, reputation drops, done) or **Contest**.
5. On contest, `openCase()` selects 5 jurors from the pool of everyone who has called `becomeJuror()`.
6. Selected jurors see the case in their Juror Panel: complaint details, evidence (rendered from IPFS via the Pinata gateway), and two buttons — Uphold / Reject.
7. After the voting window (or once all 5 have voted), anyone can trigger `finalizeCase()` (the frontend should auto-trigger this for the demo). Majority verdict is recorded, `ReputationManager.updateScore()` runs, and juror stakes are settled.
8. Both parties and the customer see the final, on-chain verdict with a link to view the transaction on the Amoy block explorer — this is your "look, it's really on the blockchain" moment for the viva.

---

## 10. Frontend — Pages per Role & Design Direction

**Design language:** neo-brutalist — thick (3–4px) solid black borders, hard drop shadows (offset, no blur), a small bold color palette (e.g. Swiggy-orange `#FC8019` or Zomato-red `#E23744` as the primary, plus black/white/one accent), oversized bold sans-serif headings, chunky buttons with a visible pressed state (shadow disappears on click), no gradients, no soft rounded-everything — occasional sharp corners mixed with a few rounded blocks for contrast.

- **Public:** Landing page, Login/Register (role picker + wallet connect)
- **Customer:** Restaurant list/search, Restaurant menu + cart, Order tracking (live status via Socket.io, progress-bar style), Order history, Complaint filing form, Complaint status tracker
- **Restaurant:** Incoming orders queue, Menu management, Complaints inbox (accept/contest), Reputation score display
- **Delivery Partner:** Assigned deliveries, status update buttons, Complaints inbox, Reputation score display
- **Juror:** "Become a Juror" (stake flow), Assigned cases list, Case detail (evidence viewer + vote buttons), Voting history & stake balance
- **Admin:** All-orders table with force-state buttons, All-complaints/disputes table, force-finalize button, basic restaurant/menu seeding UI

---

## 11. Repository Structure

```
foodchain/
├── contracts/                  # Hardhat project
│   ├── contracts/
│   │   ├── UserRegistry.sol
│   │   ├── OrderRegistry.sol
│   │   ├── ComplaintRegistry.sol
│   │   ├── DisputeResolution.sol
│   │   └── ReputationManager.sol
│   ├── scripts/deploy.js
│   ├── test/*.test.js
│   └── hardhat.config.js
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── blockchain.js   # ethers.js contract instances, event listeners
│   │   │   └── ipfs.js         # Pinata upload helper
│   │   ├── middleware/auth.js
│   │   ├── sockets/orderEvents.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/ (useWallet.js, useContract.js, useSocket.js)
│   │   ├── context/ (AuthContext, Web3Context)
│   │   ├── styles/ (tailwind.config.js — neo-brutalist theme tokens)
│   │   └── App.jsx
│   └── package.json
└── docs/
    └── this file
```

---

## 12. Phased Build Procedure (give this to the agent as the execution order)

**Phase 0 — Setup**
1. Create the free accounts in Section 4. Collect: Amoy RPC URL, a funded deployer private key, Pinata JWT, MongoDB URI.
2. Scaffold the three sub-projects (`contracts`, `backend`, `frontend`) per the structure above. Init git.

**Phase 1 — Smart Contracts**
3. Implement all five contracts per Section 5. Use OpenZeppelin where noted.
4. Write Hardhat unit tests covering: user registration, order anchoring, filing/accepting/contesting a complaint, full jury flow (register jurors → open case → vote → finalize → reputation updates and stake settlement).
5. Deploy to Polygon Amoy via a Hardhat script; save deployed addresses + ABIs to a shared `contracts/deployed/` folder the backend and frontend both read from.
6. Verify contracts on the Amoy block explorer (optional but good for the viva).

**Phase 2 — Backend**
7. Set up Express, Mongoose models (Section 6), JWT auth with role middleware.
8. Build the REST endpoints (Section 7). Wire `blockchain.js` to read the deployed ABIs/addresses and expose helper functions (`markDelivered`, event listeners that update the ComplaintCache/JurorVoteCache when on-chain events fire).
9. Build `ipfs.js` using the Pinata SDK for evidence uploads.
10. Add the order auto-advance timers (Section 8) — a simple `setTimeout`/cron-style job per order is fine at this scale.
11. Wire Socket.io: emit `orderStatusChanged`, `complaintUpdated`, `newAssignedCase` events.

**Phase 3 — Frontend**
12. Scaffold Vite + React + Tailwind; build the neo-brutalist design tokens (colors, shadow utility classes, button component) first, before pages.
13. Build `useWallet` (MetaMask connect/detect network/switch to Amoy) and `useContract` (typed helpers per contract) hooks.
14. Build pages role by role (Section 10), reusing a shared `OrderCard`, `ComplaintCard`, `EvidenceUploader`, `StatusBadge`.
15. Wire Socket.io client for live order tracking.

**Phase 4 — Integration & Seed Data**
16. Seed ~15–20 restaurants + menu items (use the Kaggle Zomato dataset or hand-write a realistic JSON seed file) via a `backend/scripts/seed.js`.
17. Create demo accounts for each role and a handful of juror wallets; fund all with Amoy faucet POL.
18. Run a full manual end-to-end pass: place order → progress through states → deliver → file complaint → contest → jury votes → finalize → reputation change visible in UI.

**Phase 5 — Deployment**
19. Push to GitHub. Connect `frontend/` to Vercel (set `VITE_API_URL`, contract addresses, chain config as env vars). Connect `backend/` to Render (set Mongo URI, Pinata JWT, Alchemy RPC URL, deployer private key, JWT secret as env vars).
20. Smoke-test the live URLs end-to-end. Note the Render free-tier cold-start delay in your docs so it doesn't surprise you mid-viva.

**Phase 6 — Demo Script**
21. Prepare a fixed demo path: 2 pre-seeded orders already near "delivered," one clean complaint (auto-resolve path) and one contested complaint with jurors ready to vote live, so the viva demo doesn't depend on waiting through real timers.

---

## 13. Environment Variables Checklist

**contracts/.env**: `AMOY_RPC_URL`, `DEPLOYER_PRIVATE_KEY`

**backend/.env**: `MONGO_URI`, `JWT_SECRET`, `AMOY_RPC_URL`, `BACKEND_WALLET_PRIVATE_KEY`, `PINATA_JWT`, `USER_REGISTRY_ADDRESS`, `ORDER_REGISTRY_ADDRESS`, `COMPLAINT_REGISTRY_ADDRESS`, `DISPUTE_RESOLUTION_ADDRESS`, `REPUTATION_MANAGER_ADDRESS`, `FRONTEND_URL` (for CORS)

**frontend/.env**: `VITE_API_URL`, `VITE_CHAIN_ID_AMOY` (80002), `VITE_*_ADDRESS` (one per contract), `VITE_PINATA_GATEWAY_URL`

---

## 14. Known Limitations to State Proactively in Your Report/Viva

- The backend relayer wallet is a centralization point for order-state anchoring — a fully decentralized version would have each role sign their own state-transition transactions.
- Juror selection uses on-chain pseudo-randomness (e.g. blockhash), which is manipulable in a high-value production system; Chainlink VRF is the standard real-world fix, called out here as future work.
- Free-tier hosting (Render) cold-starts after inactivity, causing a first-request delay — a known, disclosed limitation, not a bug.
- Restaurant/menu data is realistic but not live-synced with actual Swiggy/Zomato, since no free API exposes that.

---

## 15. What to Hand the Build Agent

Give the agent this entire document plus: "Build this exactly as specified, phase by phase, committing after each phase. Ask me for the account credentials/env values listed in Section 4 and Section 13 before you need them, don't invent placeholder values that silently fail."
