export const NAV_ITEMS = [
  { id: "marketplace", label: "Marketplace", icon: "store" },
  { id: "listings",    label: "My Listings", icon: "list" },
  { id: "meetups",     label: "Meetups",     icon: "map-pin" },
  { id: "verification",label: "Verification",icon: "shield" },
  { id: "bookings",    label: "Bookings",    icon: "calendar" },
];

export const SCHEDULE_ITEMS = [
  {
    id: 1,
    time: "10:30",
    period: "AM",
    item: "Organic Chemistry Textbook",
    seller: "Sarah Jenkins",
    buyer: "Marcus Wei",
    booth: "Booth A-4",
    boothVariant: "green",
  },
  {
    id: 2,
    time: "11:15",
    period: "AM",
    item: "Ergonomic Office Chair",
    seller: "Prof. Aris",
    buyer: "Lena Roth",
    booth: "Lobby West",
    boothVariant: "blue",
  },
  {
    id: 3,
    time: "12:00",
    period: "PM",
    item: "Graphing Calculator TI-84",
    seller: "David Kim",
    buyer: "Jordon S.",
    booth: "Booth B-2",
    boothVariant: "green",
  },
];

export const VERIFICATION_ITEMS = [
  {
    id: 1,
    priority: "high",
    priorityLabel: "HIGH VALUE ITEM",
    name: "Canon EOS R6 Mark II",
    dropper: "Dropped by: Alex Chen",
    emoji: "📷",
    status: "pending",
  },
  {
    id: 2,
    priority: "standard",
    priorityLabel: "STANDARD ITEM",
    name: "Calculus: Early Transcendentals",
    dropper: "Dropped by: Sam R.",
    emoji: "📚",
    status: "pending",
  },
  {
    id: 3,
    priority: "processing",
    priorityLabel: "PROCESSING...",
    name: "Nike Air Jordan 1 Retro",
    dropper: "Awaiting approval.",
    emoji: "👟",
    status: "processing",
  },
];

export const HERO_STATS = [
  { label: "TODAY'S TRAFFIC", value: 142, sub: "Meetups" },
  { label: "PENDING ITEMS",   value: 28,  sub: "Verified" },
];
