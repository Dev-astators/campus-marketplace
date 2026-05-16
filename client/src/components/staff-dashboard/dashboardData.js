export const NAV_ITEMS = [
  { id: "marketplace", label: "Marketplace", icon: "store" },
  { id: "listings",    label: "My Listings", icon: "list" },
  { id: "meetups",     label: "Meetups",     icon: "map-pin" },
  { id: "verification",label: "Verification",icon: "shield" },
  { id: "confirmed",   label: "Confirmed Transactions", icon: "check" },
  { id: "bookings",    label: "Bookings",    icon: "calendar" },
];

export const STAFF_VIEW_CONTENT = {
  meetups: {
    eyebrow: "Trade facility schedule",
    title: "Drop-off and collection windows",
    description:
      "Track the live booking load across the campus trade facility and keep an eye on which windows are already full.",
  },
  verification: {
    eyebrow: "Receipt and release checks",
    title: "Staff handoff controls",
    description:
      "Confirm physical receipt at drop-off, verify buyer arrival, and release items only after cash handoff is confirmed.",
  },
  confirmed: {
    eyebrow: "Confirmed handoffs",
    title: "Completed transaction archive",
    description:
      "Review fully confirmed facility handoffs separately so the active transaction flow stays focused on work that still needs staff action.",
  },
  bookings: {
    eyebrow: "Trade facility management",
    title: "Campus exchange operations",
    description:
      "Monitor operating hours, slot capacity, active bookings, and the pending transaction flow that still needs staff action.",
  },
};

export const FACILITY_PROFILE = {
  name: "Braamfontein Trade Facility",
  location: "Wits Central Campus Exchange Hub",
  slotCapacity: 10,
  collectionCapacity: 8,
  deskCount: 3,
  supervisor: "Kamo Maseko",
  supportLine: "011 555 0142",
  status: "Operational",
};

export const FACILITY_HOURS = [
  { day: "Monday", open: "08:00", close: "18:00", active: true },
  { day: "Tuesday", open: "08:00", close: "18:00", active: true },
  { day: "Wednesday", open: "08:00", close: "18:00", active: true },
  { day: "Thursday", open: "08:00", close: "18:00", active: true },
  { day: "Friday", open: "08:00", close: "17:00", active: true },
  { day: "Saturday", open: "09:00", close: "13:00", active: false },
  { day: "Sunday", open: "", close: "", active: false },
];

export const BOOKING_SLOTS = [
  {
    id: "slot-09-dropoff",
    time: "09:00",
    type: "Drop-off",
    booked: 10,
    capacity: 10,
    zone: "Desk A",
    transactionId: "TX-204",
    item: "Canon EOS R6 Mark II",
  },
  {
    id: "slot-10-dropoff",
    time: "10:30",
    type: "Drop-off",
    booked: 7,
    capacity: 10,
    zone: "Desk B",
    transactionId: "TX-228",
    item: "Calculus Textbook Bundle",
  },
  {
    id: "slot-12-dropoff",
    time: "12:00",
    type: "Drop-off",
    booked: 6,
    capacity: 10,
    zone: "Desk C",
    transactionId: "TX-243",
    item: "Ikea Study Chair",
  },
  {
    id: "slot-14-collection",
    time: "14:00",
    type: "Collection",
    booked: 5,
    capacity: 8,
    zone: "Collection Bay 1",
    transactionId: "TX-251",
    item: "Nike Air Jordan 1 Retro",
  },
  {
    id: "slot-15-collection",
    time: "15:30",
    type: "Collection",
    booked: 8,
    capacity: 8,
    zone: "Collection Bay 2",
    transactionId: "TX-204",
    item: "Canon EOS R6 Mark II",
  },
];

export const TRANSACTION_RECORDS = [
  {
    id: "TX-204",
    item: "Canon EOS R6 Mark II",
    seller: "Alex Chen",
    buyer: "Mia Patel",
    price: "R18 500",
    dropOffSlot: "09:00",
    collectionSlot: "15:30",
    location: "Desk A",
    stage: "dropoff_booked",
  },
  {
    id: "TX-228",
    item: "Calculus Textbook Bundle",
    seller: "Samir Naidoo",
    buyer: "Lebo Molefe",
    price: "R950",
    dropOffSlot: "10:30",
    collectionSlot: "16:00",
    location: "Desk B",
    stage: "collection_booked",
  },
  {
    id: "TX-251",
    item: "Nike Air Jordan 1 Retro",
    seller: "Jordan Smith",
    buyer: "Amara Khumalo",
    price: "R2 400",
    dropOffSlot: "11:00",
    collectionSlot: "14:00",
    location: "Collection Bay 1",
    stage: "buyer_arrived",
  },
  {
    id: "TX-264",
    item: "TI-84 Graphing Calculator",
    seller: "David Kim",
    buyer: "Tumi Dlamini",
    price: "R1 750",
    dropOffSlot: "08:30",
    collectionSlot: "13:30",
    location: "Collection Bay 2",
    stage: "cash_confirmed",
  },
];

export const ACTIVITY_LOG = [
  {
    id: "activity-1",
    time: "08:05",
    title: "Facility settings synced",
    detail:
      "Operating hours and slot capacity were updated by admin before opening.",
    audience: "Staff team notified",
  },
  {
    id: "activity-2",
    time: "08:40",
    title: "Collection slot booked for TX-228",
    detail:
      "Buyer and seller were notified automatically after the collection booking was confirmed.",
    audience: "Buyer and seller notified",
  },
  {
    id: "activity-3",
    time: "08:55",
    title: "09:00 drop-off window is full",
    detail:
      "The booking system stopped accepting more drop-off bookings for the 09:00 window.",
    audience: "Capacity enforcement active",
  },
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
