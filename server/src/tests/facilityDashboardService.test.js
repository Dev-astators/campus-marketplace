jest.mock("../config/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../config/supabaseClient");
const {
  getFacilityDashboard,
  advanceFacilityTransaction,
} = require("../services/facilityDashboardService");

const createMaybeSingleBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn(() => builder);
  builder.maybeSingle = jest.fn().mockResolvedValue(result);
  return builder;
};

const createOrderBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn().mockResolvedValue(result);
  return builder;
};

const createUpcomingSlotsBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.gte = jest.fn(() => builder);
  builder.order = jest
    .fn()
    .mockImplementationOnce(() => builder)
    .mockImplementationOnce(() => builder);
  builder.limit = jest.fn().mockResolvedValue(result);
  return builder;
};

const createInBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.in = jest.fn().mockResolvedValue(result);
  return builder;
};

const createSingleBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn().mockResolvedValue(result);
  return builder;
};

const createUpdateEqBuilder = (result) => {
  const builder = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn().mockResolvedValue(result);
  return builder;
};

const createInsertBuilder = (result) => {
  const builder = {};
  builder.insert = jest.fn().mockResolvedValue(result);
  return builder;
};

const queueFromBuilders = (buildersByTable) => {
  const queues = Object.fromEntries(
    Object.entries(buildersByTable).map(([table, builders]) => [
      table,
      [...builders],
    ]),
  );

  supabase.from.mockImplementation((table) => {
    if (!queues[table] || queues[table].length === 0) {
      if (table === "notifications") {
        return createInsertBuilder({ error: null });
      }
      throw new Error(`Unexpected supabase.from(${table})`);
    }

    return queues[table].shift();
  });
};

describe("facilityDashboardService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFacilityDashboard", () => {
    test("Given no active facility, when fetched, then an empty dashboard payload is returned", async () => {
      queueFromBuilders({
        trade_facilities: [
          createMaybeSingleBuilder({
            data: null,
            error: null,
          }),
        ],
      });

      const { data, error } = await getFacilityDashboard(
        "2026-05-10",
        undefined,
        "admin",
      );

      expect(error).toBeNull();
      expect(data).toEqual({
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
        selectedDate: "2026-05-10",
      });
      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(supabase.from).toHaveBeenCalledWith("trade_facilities");
    });

    test("Given slot lookup fails, when fetched, then the service returns the slot error", async () => {
      const slotError = { message: "Slot lookup failed" };

      queueFromBuilders({
        trade_facilities: [
          createMaybeSingleBuilder({
            data: {
              id: "facility-1",
              name: "Wits Exchange Hub",
              location: "Braamfontein",
              slot_capacity: 10,
              is_active: true,
              operating_hours: [],
            },
            error: null,
          }),
        ],
        facility_slots: [
          createOrderBuilder({
            data: null,
            error: slotError,
          }),
        ],
      });

      const result = await getFacilityDashboard(
        "2026-05-10",
        "facility-1",
        "facility_staff",
      );

      expect(result.data).toBeNull();
      expect(result.error).toEqual(slotError);
    });

    test("Given facility, slots, bookings and transactions, when fetched, then dashboard data is normalized for the staff UI", async () => {
      queueFromBuilders({
        trade_facilities: [
          createMaybeSingleBuilder({
            data: {
              id: "facility-1",
              name: "Wits Exchange Hub",
              location: "Braamfontein Campus",
              slot_capacity: 10,
              is_active: true,
              operating_hours: {
                Monday: {
                  open: "08:00",
                  close: "18:00",
                  active: true,
                },
              },
            },
            error: null,
          }),
        ],
        facility_slots: [
          createOrderBuilder({
            data: [
              {
                id: "slot-1",
                facility_id: "facility-1",
                slot_date: "2026-05-10",
                slot_time: "09:00:00",
                capacity: 10,
                booked_count: 10,
              },
              {
                id: "slot-2",
                facility_id: "facility-1",
                slot_date: "2026-05-10",
                slot_time: "10:30:00",
                capacity: 10,
                booked_count: 6,
              },
            ],
            error: null,
          }),
        ],
        facility_bookings: [
          createInBuilder({
            data: [
              {
                id: "booking-1",
                transaction_id: "tx-1",
                slot_id: "slot-1",
                booking_type: "drop_off",
                status: "confirmed",
                confirmed_at: "2026-05-10T07:00:00.000Z",
                staff_confirmed_by: "Staff A",
              },
              {
                id: "booking-2",
                transaction_id: "tx-1",
                slot_id: "slot-2",
                booking_type: "collection",
                status: "pending",
                confirmed_at: null,
                staff_confirmed_by: null,
              },
              {
                id: "booking-3",
                transaction_id: "tx-2",
                slot_id: "slot-1",
                booking_type: "collection",
                status: "complete",
                confirmed_at: "2026-05-10T08:00:00.000Z",
                staff_confirmed_by: "Staff A",
              },
            ],
            error: null,
          }),
        ],
        transactions: [
          createInBuilder({
            data: [
              {
                id: "tx-1",
                status: "confirmed",
                online_amount: 500,
                cash_shortfall: 100,
                cash_settled: false,
                created_at: "2026-05-10T06:00:00.000Z",
                listing: {
                  id: "listing-1",
                  title: "Laptop",
                  category: "Electronics",
                  asking_price: 600,
                },
                buyer: {
                  id: "buyer-1",
                  full_name: "Buyer One",
                  email: "buyer@example.com",
                },
                seller: {
                  id: "seller-1",
                  full_name: "Seller One",
                  email: "seller@example.com",
                },
              },
              {
                id: "tx-2",
                status: "complete",
                online_amount: 0,
                cash_shortfall: 0,
                cash_settled: true,
                created_at: "2026-05-10T05:00:00.000Z",
                listing: {
                  id: "listing-2",
                  title: "Statistics Textbook",
                  category: "Textbooks",
                  asking_price: 220,
                },
                buyer: {
                  id: "buyer-2",
                  full_name: "Buyer Two",
                  email: "buyer2@example.com",
                },
                seller: {
                  id: "seller-2",
                  full_name: "Seller Two",
                  email: "seller2@example.com",
                },
              },
            ],
            error: null,
          }),
        ],
      });

      const { data, error } = await getFacilityDashboard(
        "2026-05-10",
        "facility-1",
        "facility_staff",
      );

      expect(error).toBeNull();
      expect(data.selectedDate).toBe("2026-05-10");
      expect(data.facility).toEqual({
        id: "facility-1",
        name: "Wits Exchange Hub",
        location: "Braamfontein Campus",
        slotCapacity: 10,
        isActive: true,
      });
      expect(data.operatingHours).toEqual([
        {
          day: "Monday",
          open: "08:00",
          close: "18:00",
          active: true,
        },
      ]);

      expect(data.metrics).toEqual({
        totalCapacity: 20,
        totalBookedSlots: 2,
        fullSlots: 0,
        pendingTransactions: 1,
        completedTransactions: 1,
      });

      expect(data.slots).toHaveLength(2);
      expect(data.slots[0]).toEqual(
        expect.objectContaining({
          id: "slot-1",
          time: "09:00",
          booked: 1,
          capacity: 10,
          availabilityLabel: "9 left",
          status: "Open",
          dropOffCount: 1,
          collectionCount: 0,
          bookingSummary: "1 drop-off, 0 collection",
          linkedTransactions: [
            {
              id: "tx-1",
              itemTitle: "Laptop",
              bookingType: "dropoff",
            },
          ],
          facilityName: "Wits Exchange Hub",
        }),
      );

      expect(data.transactions).toHaveLength(2);
      expect(data.transactions[0]).toEqual(
        expect.objectContaining({
          id: "tx-1",
          item: "Laptop",
          seller: "Seller One",
          buyer: "Buyer One",
          category: "Electronics",
          stage: "collection_booked",
          stageLabel: "Collection booked",
          action: "confirm_buyer_arrival",
          dropOffSlot: "2026-05-10 09:00",
          collectionSlot: "2026-05-10 10:30",
        }),
      );
      expect(data.transactions[0].priceDisplay).toContain("600");

      expect(data.transactions[1]).toEqual(
        expect.objectContaining({
          id: "tx-2",
          item: "Statistics Textbook",
          stage: "complete",
          stageLabel: "Complete",
          action: null,
          actionLabel: "",
        }),
      );

      const activityTitles = data.activityLog.map((entry) => entry.title);
      expect(activityTitles).toEqual(
        expect.arrayContaining([
          "Drop-off confirmed for tx-1",
          "Collection completed for tx-2",
          "Transaction completed for tx-2",
        ]),
      );
      expect(activityTitles).not.toContain("09:00 slot reached capacity");
    });

    test("Given no explicit date and future bookings exist, when fetched, then the dashboard resolves to the earliest upcoming booked date", async () => {
      queueFromBuilders({
        trade_facilities: [
          createMaybeSingleBuilder({
            data: {
              id: "facility-1",
              name: "Wits Exchange Hub",
              location: "Braamfontein Campus",
              slot_capacity: 10,
              is_active: true,
              operating_hours: [],
            },
            error: null,
          }),
        ],
        facility_slots: [
          createUpcomingSlotsBuilder({
            data: [
              {
                id: "slot-empty",
                facility_id: "facility-1",
                slot_date: "2026-05-16",
                slot_time: "09:00:00",
                capacity: 10,
                booked_count: 0,
              },
              {
                id: "slot-booked",
                facility_id: "facility-1",
                slot_date: "2026-05-17",
                slot_time: "10:00:00",
                capacity: 10,
                booked_count: 1,
              },
            ],
            error: null,
          }),
        ],
        facility_bookings: [
          createInBuilder({
            data: [
              {
                id: "booking-1",
                transaction_id: "tx-1",
                slot_id: "slot-booked",
                booking_type: "collection",
                status: "pending",
                confirmed_at: null,
                staff_confirmed_by: null,
              },
            ],
            error: null,
          }),
        ],
        transactions: [
          createInBuilder({
            data: [
              {
                id: "tx-1",
                status: "confirmed",
                online_amount: 500,
                cash_shortfall: 0,
                cash_settled: true,
                created_at: "2026-05-16T06:00:00.000Z",
                listing: {
                  id: "listing-1",
                  title: "Laptop",
                  category: "Electronics",
                  asking_price: 500,
                },
                buyer: {
                  id: "buyer-1",
                  full_name: "Buyer One",
                  email: "buyer@example.com",
                },
                seller: {
                  id: "seller-1",
                  full_name: "Seller One",
                  email: "seller@example.com",
                },
              },
            ],
            error: null,
          }),
        ],
      });

      const { data, error } = await getFacilityDashboard(
        undefined,
        "facility-1",
        "facility_staff",
      );

      expect(error).toBeNull();
      expect(data.selectedDate).toBe("2026-05-17");
      expect(data.slots).toHaveLength(1);
      expect(data.slots[0]).toEqual(
        expect.objectContaining({
          id: "slot-booked",
          date: "2026-05-17",
          bookingSummary: "0 drop-off, 1 collection",
        }),
      );
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0]).toEqual(
        expect.objectContaining({
          id: "tx-1",
          collectionSlot: "2026-05-17 10:00",
        }),
      );
    });

    test("Given staff has no assigned facility, when fetched, then a permission error is returned", async () => {
      const result = await getFacilityDashboard(
        "2026-05-10",
        undefined,
        "facility_staff",
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.statusCode).toBe(403);
      expect(result.error.message).toBe(
        "No trade facility is assigned to this staff profile.",
      );
    });
  });

  describe("advanceFacilityTransaction", () => {
    const facilityRecord = {
      id: "facility-1",
      name: "Wits Exchange Hub",
      location: "Braamfontein Campus",
      slot_capacity: 10,
      is_active: true,
      operating_hours: [],
    };

    const upcomingSlots = [
      {
        id: "slot-1",
        facility_id: "facility-1",
        slot_date: "2026-05-18",
        slot_time: "09:00:00",
        capacity: 10,
        booked_count: 1,
      },
      {
        id: "slot-2",
        facility_id: "facility-1",
        slot_date: "2026-05-18",
        slot_time: "10:30:00",
        capacity: 10,
        booked_count: 1,
      },
    ];

    const dashboardTransaction = (overrides = {}) => ({
      id: "tx-1",
      status: "confirmed",
      online_amount: 500,
      cash_shortfall: 120,
      cash_settled: false,
      created_at: "2026-05-10T06:00:00.000Z",
      listing: {
        id: "listing-1",
        title: "Laptop",
        category: "Electronics",
        asking_price: 620,
      },
      buyer: {
        id: "buyer-1",
        full_name: "Buyer One",
        email: "buyer@example.com",
      },
      seller: {
        id: "seller-1",
        full_name: "Seller One",
        email: "seller@example.com",
      },
      ...overrides,
    });

    const transactionLookupRecord = (overrides = {}) => ({
      id: "tx-1",
      status: "confirmed",
      online_amount: 500,
      cash_shortfall: 120,
      cash_settled: false,
      created_at: "2026-05-10T06:00:00.000Z",
      bookings: [],
      listing: {
        id: "listing-1",
        title: "Laptop",
        category: "Electronics",
        asking_price: 620,
      },
      buyer: {
        id: "buyer-1",
        full_name: "Buyer One",
        email: "buyer@example.com",
      },
      seller: {
        id: "seller-1",
        full_name: "Seller One",
        email: "seller@example.com",
      },
      ...overrides,
    });

    test("Given transaction lookup fails, when action is advanced, then the lookup error is returned", async () => {
      queueFromBuilders({
        transactions: [
          createSingleBuilder({
            data: null,
            error: { message: "Transaction lookup failed" },
          }),
        ],
      });

      const result = await advanceFacilityTransaction({
        transactionId: "tx-404",
        action: "confirm_dropoff",
        staffIdentifier: "Staff A",
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Transaction lookup failed" });
    });

    test("Given confirm_dropoff with no drop-off booking, when advanced, then a friendly validation error is returned", async () => {
      queueFromBuilders({
        transactions: [
          createSingleBuilder({
            data: {
              id: "tx-1",
              status: "pending",
              bookings: [
                {
                  id: "booking-1",
                  booking_type: "collection",
                },
              ],
            },
            error: null,
          }),
        ],
      });

      const result = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_dropoff",
        staffIdentifier: "Staff A",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe(
        "No drop-off booking is linked to this transaction",
      );
    });

    test("Given confirm_dropoff succeeds, when advanced, then item receipt is confirmed and the next buyer-arrival action is returned", async () => {
      const transactionLookupBuilder = createSingleBuilder({
        data: transactionLookupRecord({
          bookings: [
            {
              id: "booking-1",
              booking_type: "drop_off",
              status: "pending",
              confirmed_at: null,
              staff_confirmed_by: null,
              slot: upcomingSlots[0],
            },
            {
              id: "booking-2",
              booking_type: "collection",
              status: "pending",
              confirmed_at: null,
              staff_confirmed_by: null,
              slot: upcomingSlots[1],
            },
          ],
        }),
        error: null,
      });
      const bookingUpdateBuilder = createUpdateEqBuilder({ error: null });
      const transactionUpdateBuilder = createUpdateEqBuilder({ error: null });

      queueFromBuilders({
        facility_bookings: [
          bookingUpdateBuilder,
          createInBuilder({
            data: [
              {
                id: "booking-1",
                transaction_id: "tx-1",
                slot_id: "slot-1",
                booking_type: "drop_off",
                status: "confirmed",
                confirmed_at: "2026-05-18T07:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
              {
                id: "booking-2",
                transaction_id: "tx-1",
                slot_id: "slot-2",
                booking_type: "collection",
                status: "pending",
                confirmed_at: null,
                staff_confirmed_by: null,
              },
            ],
            error: null,
          }),
        ],
        facility_slots: [
          createUpcomingSlotsBuilder({
            data: upcomingSlots,
            error: null,
          }),
        ],
        trade_facilities: [
          createMaybeSingleBuilder({
            data: facilityRecord,
            error: null,
          }),
        ],
        notifications: [
          createInsertBuilder({ error: null }),
          createInsertBuilder({ error: null }),
        ],
        transactions: [
          transactionLookupBuilder,
          transactionUpdateBuilder,
          createInBuilder({
            data: [dashboardTransaction()],
            error: null,
          }),
        ],
      });

      const { data, error } = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_dropoff",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(error).toBeNull();
      expect(bookingUpdateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "confirmed",
          staff_confirmed_by: "Karabo Tlaka",
          confirmed_at: expect.any(String),
        }),
      );
      expect(bookingUpdateBuilder.eq).toHaveBeenCalledWith("id", "booking-1");
      expect(transactionUpdateBuilder.update).toHaveBeenCalledWith({
        status: "confirmed",
      });
      expect(transactionUpdateBuilder.eq).toHaveBeenCalledWith("id", "tx-1");
      expect(data.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "tx-1",
            stage: "collection_booked",
            action: "confirm_buyer_arrival",
            actionLabel: "Confirm buyer arrival",
          }),
        ]),
      );
    });

    test("Given confirm_buyer_arrival is attempted before drop-off confirmation, when advanced, then the service blocks the step", async () => {
      queueFromBuilders({
        transactions: [
          createSingleBuilder({
            data: transactionLookupRecord({
              bookings: [
                {
                  id: "booking-1",
                  booking_type: "drop_off",
                  status: "pending",
                  slot: { facility_id: "facility-1" },
                },
                {
                  id: "booking-2",
                  booking_type: "collection",
                  status: "pending",
                },
              ],
            }),
            error: null,
          }),
        ],
      });

      const result = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_buyer_arrival",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.statusCode).toBe(400);
      expect(result.error.message).toBe(
        "Item receipt must be confirmed before buyer arrival can be recorded.",
      );
    });

    test("Given confirm_buyer_arrival succeeds, when advanced, then buyer arrival is confirmed and the next cash-handoff action is returned", async () => {
      const transactionLookupBuilder = createSingleBuilder({
        data: transactionLookupRecord({
          bookings: [
            {
              id: "booking-1",
              booking_type: "drop_off",
              status: "confirmed",
              confirmed_at: "2026-05-18T07:00:00.000Z",
              staff_confirmed_by: "Karabo Tlaka",
              slot: upcomingSlots[0],
            },
            {
              id: "booking-2",
              booking_type: "collection",
              status: "pending",
              confirmed_at: null,
              staff_confirmed_by: null,
              slot: upcomingSlots[1],
            },
          ],
        }),
        error: null,
      });
      const bookingUpdateBuilder = createUpdateEqBuilder({ error: null });
      const transactionUpdateBuilder = createUpdateEqBuilder({ error: null });

      queueFromBuilders({
        facility_bookings: [
          bookingUpdateBuilder,
          createInBuilder({
            data: [
              {
                id: "booking-1",
                transaction_id: "tx-1",
                slot_id: "slot-1",
                booking_type: "drop_off",
                status: "confirmed",
                confirmed_at: "2026-05-18T07:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
              {
                id: "booking-2",
                transaction_id: "tx-1",
                slot_id: "slot-2",
                booking_type: "collection",
                status: "confirmed",
                confirmed_at: "2026-05-18T08:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
            ],
            error: null,
          }),
        ],
        facility_slots: [
          createUpcomingSlotsBuilder({
            data: upcomingSlots,
            error: null,
          }),
        ],
        trade_facilities: [
          createMaybeSingleBuilder({
            data: facilityRecord,
            error: null,
          }),
        ],
        notifications: [
          createInsertBuilder({ error: null }),
          createInsertBuilder({ error: null }),
        ],
        transactions: [
          transactionLookupBuilder,
          transactionUpdateBuilder,
          createInBuilder({
            data: [dashboardTransaction()],
            error: null,
          }),
        ],
      });

      const { data, error } = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_buyer_arrival",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(error).toBeNull();
      expect(bookingUpdateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "confirmed",
          staff_confirmed_by: "Karabo Tlaka",
          confirmed_at: expect.any(String),
        }),
      );
      expect(bookingUpdateBuilder.eq).toHaveBeenCalledWith("id", "booking-2");
      expect(transactionUpdateBuilder.update).toHaveBeenCalledWith({
        status: "confirmed",
      });
      expect(data.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "tx-1",
            stage: "buyer_arrived",
            action: "confirm_cash_handoff",
            actionLabel: "Confirm cash handoff",
          }),
        ]),
      );
    });

    test("Given confirm_cash_handoff is attempted before buyer arrival confirmation, when advanced, then the service blocks the step", async () => {
      queueFromBuilders({
        transactions: [
          createSingleBuilder({
            data: transactionLookupRecord({
              bookings: [
                {
                  id: "booking-1",
                  booking_type: "drop_off",
                  status: "confirmed",
                  slot: { facility_id: "facility-1" },
                },
                {
                  id: "booking-2",
                  booking_type: "collection",
                  status: "pending",
                },
              ],
            }),
            error: null,
          }),
        ],
      });

      const result = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_cash_handoff",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.statusCode).toBe(400);
      expect(result.error.message).toBe(
        "Buyer arrival must be confirmed before cash handoff can be recorded.",
      );
    });

    test("Given confirm_cash_handoff succeeds, when advanced, then the transaction becomes cash-settled and the release action is returned", async () => {
      const transactionLookupBuilder = createSingleBuilder({
        data: transactionLookupRecord({
          bookings: [
            {
              id: "booking-1",
              booking_type: "drop_off",
              status: "confirmed",
              slot: upcomingSlots[0],
            },
            {
              id: "booking-2",
              booking_type: "collection",
              status: "confirmed",
              slot: upcomingSlots[1],
            },
          ],
        }),
        error: null,
      });
      const transactionUpdateBuilder = createUpdateEqBuilder({ error: null });

      queueFromBuilders({
        facility_bookings: [
          createInBuilder({
            data: [
              {
                id: "booking-1",
                transaction_id: "tx-1",
                slot_id: "slot-1",
                booking_type: "drop_off",
                status: "confirmed",
                confirmed_at: "2026-05-18T07:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
              {
                id: "booking-2",
                transaction_id: "tx-1",
                slot_id: "slot-2",
                booking_type: "collection",
                status: "confirmed",
                confirmed_at: "2026-05-18T08:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
            ],
            error: null,
          }),
        ],
        facility_slots: [
          createUpcomingSlotsBuilder({
            data: upcomingSlots,
            error: null,
          }),
        ],
        trade_facilities: [
          createMaybeSingleBuilder({
            data: facilityRecord,
            error: null,
          }),
        ],
        notifications: [
          createInsertBuilder({ error: null }),
          createInsertBuilder({ error: null }),
        ],
        transactions: [
          transactionLookupBuilder,
          transactionUpdateBuilder,
          createInBuilder({
            data: [dashboardTransaction({ cash_settled: true })],
            error: null,
          }),
        ],
      });

      const { data, error } = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_cash_handoff",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(error).toBeNull();
      expect(transactionUpdateBuilder.update).toHaveBeenCalledWith({
        cash_settled: true,
        status: "confirmed",
      });
      expect(transactionUpdateBuilder.eq).toHaveBeenCalledWith("id", "tx-1");
      expect(data.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "tx-1",
            stage: "cash_confirmed",
            action: "release_item",
            actionLabel: "Release item and complete",
          }),
        ]),
      );
    });

    test("Given release_item is attempted before cash settlement, when advanced, then the service blocks the final release", async () => {
      queueFromBuilders({
        transactions: [
          createSingleBuilder({
            data: transactionLookupRecord({
              bookings: [
                {
                  id: "booking-1",
                  booking_type: "drop_off",
                  status: "confirmed",
                  slot: { facility_id: "facility-1" },
                },
                {
                  id: "booking-2",
                  booking_type: "collection",
                  status: "confirmed",
                },
              ],
            }),
            error: null,
          }),
        ],
      });

      const result = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "release_item",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.statusCode).toBe(400);
      expect(result.error.message).toBe(
        "Cash handoff must be confirmed before releasing the item.",
      );
    });

    test("Given release_item succeeds, when advanced, then the collection booking and transaction are marked complete", async () => {
      const transactionLookupBuilder = createSingleBuilder({
        data: transactionLookupRecord({
          cash_settled: true,
          bookings: [
            {
              id: "booking-1",
              booking_type: "drop_off",
              status: "confirmed",
              slot: upcomingSlots[0],
            },
            {
              id: "booking-2",
              booking_type: "collection",
              status: "confirmed",
              slot: upcomingSlots[1],
            },
          ],
        }),
        error: null,
      });
      const bookingUpdateBuilder = createUpdateEqBuilder({ error: null });
      const transactionUpdateBuilder = createUpdateEqBuilder({ error: null });

      queueFromBuilders({
        facility_bookings: [
          bookingUpdateBuilder,
          createInBuilder({
            data: [
              {
                id: "booking-1",
                transaction_id: "tx-1",
                slot_id: "slot-1",
                booking_type: "drop_off",
                status: "confirmed",
                confirmed_at: "2026-05-18T07:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
              {
                id: "booking-2",
                transaction_id: "tx-1",
                slot_id: "slot-2",
                booking_type: "collection",
                status: "complete",
                confirmed_at: "2026-05-18T09:00:00.000Z",
                staff_confirmed_by: "Karabo Tlaka",
              },
            ],
            error: null,
          }),
        ],
        facility_slots: [
          createUpcomingSlotsBuilder({
            data: upcomingSlots,
            error: null,
          }),
        ],
        trade_facilities: [
          createMaybeSingleBuilder({
            data: facilityRecord,
            error: null,
          }),
        ],
        notifications: [
          createInsertBuilder({ error: null }),
          createInsertBuilder({ error: null }),
        ],
        transactions: [
          transactionLookupBuilder,
          transactionUpdateBuilder,
          createInBuilder({
            data: [
              dashboardTransaction({ status: "complete", cash_settled: true }),
            ],
            error: null,
          }),
        ],
      });

      const { data, error } = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "release_item",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(error).toBeNull();
      expect(bookingUpdateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "complete",
          staff_confirmed_by: "Karabo Tlaka",
          confirmed_at: expect.any(String),
        }),
      );
      expect(bookingUpdateBuilder.eq).toHaveBeenCalledWith("id", "booking-2");
      expect(transactionUpdateBuilder.update).toHaveBeenCalledWith({
        cash_settled: true,
        status: "complete",
      });
      expect(transactionUpdateBuilder.eq).toHaveBeenCalledWith("id", "tx-1");
      expect(data.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "tx-1",
            stage: "complete",
            action: null,
            actionLabel: "",
          }),
        ]),
      );
    });

    test("Given a transaction belongs to another facility, when staff advance it, then access is denied", async () => {
      queueFromBuilders({
        transactions: [
          createSingleBuilder({
            data: {
              id: "tx-1",
              status: "pending",
              bookings: [
                {
                  id: "booking-1",
                  booking_type: "dropoff",
                  slot: {
                    id: "slot-1",
                    facility_id: "facility-9",
                  },
                },
              ],
            },
            error: null,
          }),
        ],
      });

      const result = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_dropoff",
        staffIdentifier: "Karabo Tlaka",
        facilityId: "facility-1",
        userRole: "facility_staff",
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.statusCode).toBe(403);
      expect(result.error.message).toBe(
        "You can only manage transactions for your assigned trade facility.",
      );
    });
  });
});
