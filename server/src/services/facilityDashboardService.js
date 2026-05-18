const { supabase } = require("../config/supabaseClient");

const FACILITY_TIME_ZONE = "Africa/Johannesburg";
const TRANSACTION_STAGE_ORDER = [
  "dropoff_booked",
  "collection_booked",
  "buyer_arrived",
  "cash_confirmed",
  "complete",
];

const TRANSACTION_STAGE_META = {
  dropoff_booked: {
    label: "Drop-off booked",
    tone: "amber",
    action: "confirm_dropoff",
    actionLabel: "Confirm item received",
  },
  collection_booked: {
    label: "Collection booked",
    tone: "blue",
    action: "confirm_buyer_arrival",
    actionLabel: "Confirm buyer arrival",
  },
  buyer_arrived: {
    label: "Buyer arrived",
    tone: "emerald",
    action: "confirm_cash_handoff",
    actionLabel: "Confirm cash handoff",
  },
  cash_confirmed: {
    label: "Cash confirmed",
    tone: "slate",
    action: "release_item",
    actionLabel: "Release item and complete",
  },
  complete: {
    label: "Complete",
    tone: "green",
    action: null,
    actionLabel: "",
  },
};

const createServiceError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getTodayInJohannesburg = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: FACILITY_TIME_ZONE,
  }).format(new Date());

const formatSlotTime = (slotTime) =>
  typeof slotTime === "string" ? slotTime.slice(0, 5) : "";

const normalizeBookingType = (bookingType) => {
  const normalizedType = String(bookingType || "").toLowerCase();

  if (normalizedType === "drop_off") {
    return "dropoff";
  }

  return normalizedType;
};

const normalizeBookingStatus = (bookingStatus) => {
  const normalizedStatus = String(bookingStatus || "").toLowerCase();

  if (["scheduled"].includes(normalizedStatus)) {
    return "pending";
  }

  if (["received", "buyer_arrived"].includes(normalizedStatus)) {
    return "confirmed";
  }

  if (["released", "completed"].includes(normalizedStatus)) {
    return "complete";
  }

  return normalizedStatus;
};

const normalizeTransactionStatus = (transactionStatus) => {
  const normalizedStatus = String(transactionStatus || "").toLowerCase();

  if (
    [
      "item_received",
      "ready_for_collection",
      "collection_booked",
      "buyer_arrived",
      "cash_confirmed",
    ].includes(normalizedStatus)
  ) {
    return "confirmed";
  }

  if (normalizedStatus === "completed") {
    return "complete";
  }

  return normalizedStatus;
};

const formatActivityTime = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: FACILITY_TIME_ZONE,
  }).format(new Date(value));
};

const normalizeOperatingHours = (operatingHours) => {
  if (Array.isArray(operatingHours)) {
    return operatingHours.map((entry) => ({
      day: entry.day || "Unknown",
      open: entry.open || "",
      close: entry.close || "",
      active: Boolean(entry.active),
    }));
  }

  if (operatingHours && typeof operatingHours === "object") {
    return Object.entries(operatingHours).map(([day, value]) => ({
      day,
      open: value?.open || "",
      close: value?.close || "",
      active: Boolean(value?.active),
    }));
  }

  return [];
};

const createSlotStatus = (booked, capacity) => {
  if (booked >= capacity) return "Full";
  if (booked >= capacity * 0.7) return "Busy";
  return "Open";
};

const countBookingsBySlotId = (bookings) =>
  bookings.reduce((counts, booking) => {
    counts[booking.slot_id] = (counts[booking.slot_id] || 0) + 1;
    return counts;
  }, {});

const getBookingByType = (bookings, bookingType) =>
  bookings.find(
    (booking) => normalizeBookingType(booking.bookingType) === bookingType,
  ) || null;

const deriveTransactionStage = (transaction, bookings) => {
  const dropOffBooking = getBookingByType(bookings, "dropoff");
  const collectionBooking = getBookingByType(bookings, "collection");
  const rawTransactionStatus = String(transaction.status || "").toLowerCase();
  const transactionStatus = normalizeTransactionStatus(transaction.status);
  const collectionStatus = normalizeBookingStatus(collectionBooking?.status);
  const dropOffStatus = normalizeBookingStatus(dropOffBooking?.status);
  const collectionConfirmed =
    collectionStatus === "confirmed" || collectionStatus === "complete";
  const dropOffConfirmed =
    dropOffStatus === "confirmed" || dropOffStatus === "complete";

  if (transactionStatus === "complete" || collectionStatus === "complete") {
    return "complete";
  }

  if (
    (collectionConfirmed && transaction.cash_settled) ||
    rawTransactionStatus === "cash_confirmed"
  ) {
    return "cash_confirmed";
  }

  if (collectionConfirmed || rawTransactionStatus === "buyer_arrived") {
    return "buyer_arrived";
  }

  if (
    ["item_received", "ready_for_collection", "collection_booked"].includes(
      rawTransactionStatus,
    ) ||
    dropOffConfirmed
  ) {
    return "collection_booked";
  }

  return "dropoff_booked";
};

const buildBookingMap = (bookings) =>
  bookings.reduce((map, booking) => {
    map.set(booking.id, booking);
    return map;
  }, new Map());

const buildSlotMap = (slots) =>
  slots.reduce((map, slot) => {
    map.set(slot.id, slot);
    return map;
  }, new Map());

const mapSlotRecord = (slot, facility, bookings, transactionMap) => {
  const slotBookings = bookings.filter(
    (booking) => booking.slot_id === slot.id,
  );
  const dropOffCount = slotBookings.filter(
    (booking) => normalizeBookingType(booking.booking_type) === "dropoff",
  ).length;
  const collectionCount = slotBookings.filter(
    (booking) => normalizeBookingType(booking.booking_type) === "collection",
  ).length;
  const booked = slotBookings.length;
  const capacity = Number(slot.capacity || 0);
  const linkedTransactions = slotBookings
    .map((booking) => {
      const transaction = transactionMap.get(booking.transaction_id);

      if (!transaction) {
        return null;
      }

      return {
        id: transaction.id,
        itemTitle: transaction.listing?.title || "Listing unavailable",
        bookingType: normalizeBookingType(booking.booking_type),
      };
    })
    .filter(Boolean);

  return {
    id: slot.id,
    date: slot.slot_date,
    time: formatSlotTime(slot.slot_time),
    booked,
    capacity,
    availabilityLabel:
      booked >= capacity ? "Full" : `${Math.max(capacity - booked, 0)} left`,
    status: createSlotStatus(booked, capacity),
    dropOffCount,
    collectionCount,
    bookingSummary: `${dropOffCount} drop-off, ${collectionCount} collection`,
    linkedTransactions,
    facilityName: facility.name,
    facilityLocation: facility.location,
  };
};

const buildPriceDisplay = (transaction, listing) => {
  const totalValue =
    Number(transaction.online_amount || 0) +
    Number(transaction.cash_shortfall || 0);

  if (totalValue > 0) {
    return formatCurrency(totalValue);
  }

  if (listing?.asking_price !== null && listing?.asking_price !== undefined) {
    return formatCurrency(listing.asking_price);
  }

  return "Amount pending";
};

const mapTransactionRecord = (transaction, bookings, facility) => {
  const stage = deriveTransactionStage(transaction, bookings);
  const stageMeta = TRANSACTION_STAGE_META[stage];
  const dropOffBooking = getBookingByType(bookings, "dropoff");
  const collectionBooking = getBookingByType(bookings, "collection");
  const progressValue = TRANSACTION_STAGE_ORDER.indexOf(stage) + 1;

  return {
    id: transaction.id,
    item: transaction.listing?.title || "Listing unavailable",
    seller: transaction.seller?.full_name || "Unknown seller",
    buyer: transaction.buyer?.full_name || "Unknown buyer",
    priceDisplay: buildPriceDisplay(transaction, transaction.listing),
    category: transaction.listing?.category || "Other",
    dropOffSlot: dropOffBooking?.slot
      ? `${dropOffBooking.slot.slot_date} ${formatSlotTime(
          dropOffBooking.slot.slot_time,
        )}`
      : "Not booked",
    collectionSlot: collectionBooking?.slot
      ? `${collectionBooking.slot.slot_date} ${formatSlotTime(
          collectionBooking.slot.slot_time,
        )}`
      : "Not booked",
    location: facility.location,
    stage,
    stageLabel: stageMeta.label,
    stageTone: stageMeta.tone,
    action: stageMeta.action,
    actionLabel: stageMeta.actionLabel,
    progressValue,
    progressMax: TRANSACTION_STAGE_ORDER.length,
    onlineAmount: transaction.online_amount,
    cashShortfall: transaction.cash_shortfall,
    cashSettled: transaction.cash_settled,
  };
};

const buildActivityFeed = ({
  slots,
  bookings,
  activeBookings,
  transactions,
  facility,
}) => {
  const activityEntries = [];
  const transactionMap = new Map(
    transactions.map((transaction) => [transaction.id, transaction]),
  );
  const activeSlotCounts = countBookingsBySlotId(activeBookings);

  for (const booking of bookings) {
    if (!booking.confirmed_at) {
      continue;
    }

    const transaction = transactionMap.get(booking.transaction_id);
    const normalizedBookingStatus = normalizeBookingStatus(booking.status);
    const bookingTypeLabel =
      normalizeBookingType(booking.booking_type) === "dropoff"
        ? "Drop-off"
        : "Collection";
    const bookingActionLabel =
      normalizedBookingStatus === "complete" ? "completed" : "confirmed";

    activityEntries.push({
      id: `${booking.id}-${normalizedBookingStatus || "confirmed"}`,
      sortValue: new Date(booking.confirmed_at).getTime(),
      time: formatActivityTime(booking.confirmed_at),
      title: `${bookingTypeLabel} ${bookingActionLabel} for ${transaction?.id || "transaction"}`,
      detail: transaction
        ? normalizedBookingStatus === "complete"
          ? `${transaction.listing?.title || "Item"} completed its facility handoff at ${facility.name}.`
          : `${transaction.listing?.title || "Item"} was updated by staff at ${facility.name}.`
        : `${bookingTypeLabel} booking was ${bookingActionLabel} by staff.`,
      audience: "Relevant parties notified",
    });
  }

  for (const slot of slots) {
    const booked = Number(activeSlotCounts[slot.id] || 0);
    const capacity = Number(slot.capacity || 0);

    if (booked >= capacity && capacity > 0) {
      const slotDateTime = `${slot.slot_date}T${slot.slot_time}`;
      activityEntries.push({
        id: `${slot.id}-full`,
        sortValue: new Date(slotDateTime).getTime(),
        time: formatSlotTime(slot.slot_time),
        title: `${formatSlotTime(slot.slot_time)} slot reached capacity`,
        detail: `${facility.name} is no longer accepting more bookings for this window.`,
        audience: "Capacity enforcement active",
      });
    }
  }

  for (const transaction of transactions) {
    if (normalizeTransactionStatus(transaction.status) === "complete") {
      activityEntries.push({
        id: `${transaction.id}-completed`,
        sortValue: new Date(transaction.created_at).getTime(),
        time: formatActivityTime(transaction.created_at),
        title: `Transaction completed for ${transaction.id}`,
        detail: `${transaction.listing?.title || "Item"} has been fully released to the buyer.`,
        audience: "Buyer and seller notified",
      });
    }
  }

  return activityEntries
    .sort((left, right) => right.sortValue - left.sortValue)
    .slice(0, 8)
    .map(({ sortValue, ...entry }) => entry);
};

const fetchDashboardTransactions = async (transactionIds) => {
  if (transactionIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from("transactions")
    .select(
      `
      id,
      status,
      online_amount,
      cash_shortfall,
      cash_settled,
      created_at,
      listing:listings (
        id,
        title,
        category,
        asking_price
      ),
      buyer:profiles!transactions_buyer_id_fkey (
        id,
        full_name,
        email
      ),
      seller:profiles!transactions_seller_id_fkey (
        id,
        full_name,
        email
      )
    `,
    )
    .in("id", transactionIds);
};

const fetchFacilityRecord = async (facilityId) => {
  const facilityQuery = supabase
    .from("trade_facilities")
    .select("*")
    .eq("is_active", true);

  if (facilityId) {
    return facilityQuery.eq("id", facilityId).maybeSingle();
  }

  return facilityQuery
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();
};

const fetchSlotsForDate = async (facilityId, selectedDate) =>
  supabase
    .from("facility_slots")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("slot_date", selectedDate)
    .order("slot_time", { ascending: true });

const fetchUpcomingSlots = async (facilityId, fromDate) =>
  supabase
    .from("facility_slots")
    .select("*")
    .eq("facility_id", facilityId)
    .gte("slot_date", fromDate)
    .order("slot_date", { ascending: true })
    .order("slot_time", { ascending: true })
    .limit(60);

const fetchBookingsForSlotIds = async (slotIds) =>
  slotIds.length
    ? supabase.from("facility_bookings").select("*").in("slot_id", slotIds)
    : { data: [], error: null };

const getFacilityDashboard = async (
  selectedDate,
  facilityId,
  userRole = "facility_staff",
) => {
  if (userRole === "facility_staff" && !facilityId) {
    return {
      data: null,
      error: createServiceError(
        "No trade facility is assigned to this staff profile.",
        403,
      ),
    };
  }

  const { data: facility, error: facilityError } =
    await fetchFacilityRecord(facilityId);

  if (facilityError) {
    return { data: null, error: facilityError };
  }

  if (facilityId && !facility) {
    return {
      data: null,
      error: createServiceError(
        "Assigned trade facility could not be found or is inactive.",
        404,
      ),
    };
  }

  if (!facility) {
    const fallbackDate = selectedDate || getTodayInJohannesburg();

    return {
      data: {
        facility: null,
        operatingHours: [],
        slots: [],
        transactions: [],
        activityLog: [],
        metrics: {
          totalCapacity: 0,
          totalBookedSlots: 0,
          fullSlots: 0,
          pendingTransactions: 0,
          completedTransactions: 0,
        },
        selectedDate: fallbackDate,
      },
      error: null,
    };
  }

  const requestedDate = selectedDate;
  const fallbackDate = getTodayInJohannesburg();
  let resolvedDate = requestedDate || fallbackDate;
  let slots = [];
  let bookings = [];

  if (requestedDate) {
    const { data: dateSlots, error: slotsError } = await fetchSlotsForDate(
      facility.id,
      requestedDate,
    );

    if (slotsError) {
      return { data: null, error: slotsError };
    }

    slots = dateSlots || [];

    const { data: dateBookings, error: bookingsError } =
      await fetchBookingsForSlotIds(slots.map((slot) => slot.id));

    if (bookingsError) {
      return { data: null, error: bookingsError };
    }

    bookings = dateBookings || [];
  } else {
    const { data: upcomingSlots, error: slotsError } = await fetchUpcomingSlots(
      facility.id,
      fallbackDate,
    );

    if (slotsError) {
      return { data: null, error: slotsError };
    }

    const allUpcomingSlots = upcomingSlots || [];
    const { data: upcomingBookings, error: bookingsError } =
      await fetchBookingsForSlotIds(allUpcomingSlots.map((slot) => slot.id));

    if (bookingsError) {
      return { data: null, error: bookingsError };
    }

    const allUpcomingBookings = upcomingBookings || [];
    const bookedSlotIds = new Set(
      allUpcomingBookings.map((booking) => booking.slot_id),
    );
    const firstRelevantSlot =
      allUpcomingSlots.find((slot) => bookedSlotIds.has(slot.id)) ||
      allUpcomingSlots[0] ||
      null;

    resolvedDate = firstRelevantSlot?.slot_date || fallbackDate;
    slots = allUpcomingSlots.filter((slot) => slot.slot_date === resolvedDate);

    const visibleSlotIds = new Set(slots.map((slot) => slot.id));
    bookings = allUpcomingBookings.filter((booking) =>
      visibleSlotIds.has(booking.slot_id),
    );
  }

  const transactionIds = [
    ...new Set((bookings || []).map((booking) => booking.transaction_id)),
  ];
  const { data: transactions, error: transactionsError } =
    await fetchDashboardTransactions(transactionIds);

  if (transactionsError) {
    return { data: null, error: transactionsError };
  }

  const bookingsByTransactionId = (bookings || []).reduce((map, booking) => {
    map[booking.transaction_id] ||= [];
    map[booking.transaction_id].push(booking);
    return map;
  }, {});

  const transactionMap = new Map(
    (transactions || []).map((transaction) => [transaction.id, transaction]),
  );

  const normalizedFacility = {
    id: facility.id,
    name: facility.name,
    location: facility.location,
    slotCapacity: facility.slot_capacity,
    isActive: facility.is_active,
  };

  const operatingHours = normalizeOperatingHours(facility.operating_hours);
  const normalizedTransactions = (transactions || []).map((transaction) => {
    const transactionBookings = (
      bookingsByTransactionId[transaction.id] || []
    ).map((booking) => ({
      id: booking.id,
      bookingType: booking.booking_type,
      status: booking.status,
      confirmedAt: booking.confirmed_at,
      staffConfirmedBy: booking.staff_confirmed_by,
      slot: (slots || []).find((slot) => slot.id === booking.slot_id) || null,
    }));

    return mapTransactionRecord(
      transaction,
      transactionBookings,
      normalizedFacility,
    );
  });
  const activeTransactionIds = new Set(
    normalizedTransactions
      .filter((transaction) => transaction.stage !== "complete")
      .map((transaction) => transaction.id),
  );
  const activeBookings = (bookings || []).filter((booking) =>
    activeTransactionIds.has(booking.transaction_id),
  );
  const normalizedSlots = (slots || []).map((slot) =>
    mapSlotRecord(slot, normalizedFacility, activeBookings, transactionMap),
  );

  const totalCapacity = normalizedSlots.reduce(
    (sum, slot) => sum + Number(slot.capacity || 0),
    0,
  );
  const totalBookedSlots = normalizedSlots.reduce(
    (sum, slot) => sum + Number(slot.booked || 0),
    0,
  );
  const fullSlots = normalizedSlots.filter(
    (slot) => slot.status === "Full",
  ).length;
  const pendingTransactions = normalizedTransactions.filter(
    (transaction) => transaction.stage !== "complete",
  ).length;
  const completedTransactions = normalizedTransactions.filter(
    (transaction) => transaction.stage === "complete",
  ).length;

  return {
    data: {
      facility: normalizedFacility,
      operatingHours,
      slots: normalizedSlots,
      transactions: normalizedTransactions,
      activityLog: buildActivityFeed({
        slots: slots || [],
        bookings: bookings || [],
        activeBookings,
        transactions: transactions || [],
        facility: normalizedFacility,
      }),
      metrics: {
        totalCapacity,
        totalBookedSlots,
        fullSlots,
        pendingTransactions,
        completedTransactions,
      },
      selectedDate: resolvedDate,
    },
    error: null,
  };
};

const getTransactionWithBookings = async (transactionId) =>
  supabase
    .from("transactions")
    .select(
      `
      id,
      status,
      online_amount,
      cash_shortfall,
      cash_settled,
      created_at,
      bookings:facility_bookings (
        id,
        booking_type,
        status,
        confirmed_at,
        staff_confirmed_by,
        slot:facility_slots (
          id,
          facility_id,
          slot_date,
          slot_time,
          capacity,
          booked_count
        )
      ),
      listing:listings (
        id,
        title,
        category,
        asking_price
      ),
      buyer:profiles!transactions_buyer_id_fkey (
        id,
        full_name,
        email
      ),
      seller:profiles!transactions_seller_id_fkey (
        id,
        full_name,
        email
      )
    `,
    )
    .eq("id", transactionId)
    .single();

const updateBookingConfirmation = async (
  bookingId,
  nextStatus,
  staffIdentifier,
) =>
  supabase
    .from("facility_bookings")
    .update({
      status: nextStatus,
      staff_confirmed_by: staffIdentifier,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

const updateTransactionRecord = async (transactionId, updates) =>
  supabase.from("transactions").update(updates).eq("id", transactionId);

const advanceFacilityTransaction = async ({
  transactionId,
  action,
  selectedDate,
  staffIdentifier,
  facilityId,
  userRole = "facility_staff",
}) => {
  const { data: transaction, error: transactionError } =
    await getTransactionWithBookings(transactionId);

  if (transactionError) {
    return { data: null, error: transactionError };
  }

  const bookings = transaction.bookings || [];
  const bookingFacilityIds = [
    ...new Set(
      bookings.map((booking) => booking.slot?.facility_id).filter(Boolean),
    ),
  ];
  const transactionFacilityId = bookingFacilityIds[0];
  const dropOffBooking = bookings.find(
    (booking) => normalizeBookingType(booking.booking_type) === "dropoff",
  );
  const collectionBooking = bookings.find(
    (booking) => normalizeBookingType(booking.booking_type) === "collection",
  );
  const dropOffConfirmed =
    normalizeBookingStatus(dropOffBooking?.status) === "confirmed" ||
    normalizeBookingStatus(dropOffBooking?.status) === "complete";
  const collectionConfirmed =
    normalizeBookingStatus(collectionBooking?.status) === "confirmed" ||
    normalizeBookingStatus(collectionBooking?.status) === "complete";
  const cashAlreadySatisfied =
    Boolean(transaction.cash_settled) ||
    Number(transaction.cash_shortfall || 0) <= 0;

  if (userRole === "facility_staff" && !facilityId) {
    return {
      data: null,
      error: createServiceError(
        "No trade facility is assigned to this staff profile.",
        403,
      ),
    };
  }

  if (
    userRole === "facility_staff" &&
    transactionFacilityId &&
    facilityId !== transactionFacilityId
  ) {
    return {
      data: null,
      error: createServiceError(
        "You can only manage transactions for your assigned trade facility.",
        403,
      ),
    };
  }

  if (action === "confirm_dropoff") {
    if (!dropOffBooking) {
      return {
        data: null,
        error: new Error("No drop-off booking is linked to this transaction"),
      };
    }

    const { error: bookingError } = await updateBookingConfirmation(
      dropOffBooking.id,
      "confirmed",
      staffIdentifier,
    );

    if (bookingError) {
      return { data: null, error: bookingError };
    }

    const { error: transactionUpdateError } = await updateTransactionRecord(
      transactionId,
      { status: "confirmed" },
    );

    if (transactionUpdateError) {
      return { data: null, error: transactionUpdateError };
    }
  }

  if (action === "confirm_buyer_arrival") {
    if (!collectionBooking) {
      return {
        data: null,
        error: new Error("No collection booking is linked to this transaction"),
      };
    }

    if (!dropOffConfirmed) {
      return {
        data: null,
        error: createServiceError(
          "Item receipt must be confirmed before buyer arrival can be recorded.",
          400,
        ),
      };
    }

    const { error: bookingError } = await updateBookingConfirmation(
      collectionBooking.id,
      "confirmed",
      staffIdentifier,
    );

    if (bookingError) {
      return { data: null, error: bookingError };
    }

    const { error: transactionUpdateError } = await updateTransactionRecord(
      transactionId,
      { status: "confirmed" },
    );

    if (transactionUpdateError) {
      return { data: null, error: transactionUpdateError };
    }
  }

  if (action === "confirm_cash_handoff") {
    if (!collectionConfirmed) {
      return {
        data: null,
        error: createServiceError(
          "Buyer arrival must be confirmed before cash handoff can be recorded.",
          400,
        ),
      };
    }

    const { error: transactionUpdateError } = await updateTransactionRecord(
      transactionId,
      {
        cash_settled: true,
        status: "confirmed",
      },
    );

    if (transactionUpdateError) {
      return { data: null, error: transactionUpdateError };
    }
  }

  if (action === "release_item") {
    if (!collectionBooking) {
      return {
        data: null,
        error: new Error("No collection booking is linked to this transaction"),
      };
    }

    if (!collectionConfirmed) {
      return {
        data: null,
        error: createServiceError(
          "Buyer arrival must be confirmed before the item can be released.",
          400,
        ),
      };
    }

    if (!cashAlreadySatisfied) {
      return {
        data: null,
        error: createServiceError(
          "Cash handoff must be confirmed before releasing the item.",
          400,
        ),
      };
    }

    const { error: bookingError } = await updateBookingConfirmation(
      collectionBooking.id,
      "complete",
      staffIdentifier,
    );

    if (bookingError) {
      return { data: null, error: bookingError };
    }

    const { error: transactionUpdateError } = await updateTransactionRecord(
      transactionId,
      {
        cash_settled: true,
        status: "complete",
      },
    );

    if (transactionUpdateError) {
      return { data: null, error: transactionUpdateError };
    }

    if (transaction?.seller?.id) {
      await supabase.from("notifications").insert({
        user_id: transaction.seller.id,
        title: "Buyer collected item",
        message: `${transaction.buyer?.full_name || "The buyer"} collected "${transaction.listing?.title || "your item"}".`,
        type: "collection",
        related_transaction_id: transactionId,
        is_read: false,
      });
    }

    if (transaction?.buyer?.id) {
      await supabase.from("notifications").insert({
        user_id: transaction.buyer.id,
        title: "Collection confirmed",
        message: `You collected "${transaction.listing?.title || "your item"}". Thanks for using the marketplace!`,
        type: "collection",
        related_transaction_id: transactionId,
        is_read: false,
      });
    }
  }

  return getFacilityDashboard(
    selectedDate,
    facilityId || transactionFacilityId,
    userRole,
  );
};

module.exports = {
  getFacilityDashboard,
  advanceFacilityTransaction,
};
