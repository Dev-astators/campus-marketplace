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

const queueFromBuilders = (buildersByTable) => {
  const queues = Object.fromEntries(
    Object.entries(buildersByTable).map(([table, builders]) => [
      table,
      [...builders],
    ]),
  );

  supabase.from.mockImplementation((table) => {
    if (!queues[table] || queues[table].length === 0) {
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

      const { data, error } = await getFacilityDashboard("2026-05-10");

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

      const result = await getFacilityDashboard("2026-05-10");

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
                booking_type: "dropoff",
                status: "received",
                confirmed_at: "2026-05-10T07:00:00.000Z",
                staff_confirmed_by: "Staff A",
              },
              {
                id: "booking-2",
                transaction_id: "tx-1",
                slot_id: "slot-2",
                booking_type: "collection",
                status: "scheduled",
                confirmed_at: null,
                staff_confirmed_by: null,
              },
              {
                id: "booking-3",
                transaction_id: "tx-2",
                slot_id: "slot-1",
                booking_type: "collection",
                status: "released",
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
                status: "item_received",
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
                status: "completed",
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

      const { data, error } = await getFacilityDashboard("2026-05-10");

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
        totalBookedSlots: 16,
        fullSlots: 1,
        pendingTransactions: 1,
        completedTransactions: 1,
      });

      expect(data.slots).toHaveLength(2);
      expect(data.slots[0]).toEqual(
        expect.objectContaining({
          id: "slot-1",
          time: "09:00",
          booked: 10,
          capacity: 10,
          availabilityLabel: "Full",
          status: "Full",
          dropOffCount: 1,
          collectionCount: 1,
          bookingSummary: "1 drop-off, 1 collection",
          leadTransactionId: "tx-1",
          leadItemTitle: "Laptop",
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
          "Collection confirmed for tx-2",
          "09:00 slot reached capacity",
          "Transaction completed for tx-2",
        ]),
      );
    });
  });

  describe("advanceFacilityTransaction", () => {
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
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe(
        "No drop-off booking is linked to this transaction",
      );
    });

    test("Given confirm_dropoff succeeds, when advanced, then booking and transaction statuses are updated and a refreshed dashboard is returned", async () => {
      const transactionLookupBuilder = createSingleBuilder({
        data: {
          id: "tx-1",
          status: "pending",
          online_amount: 500,
          cash_shortfall: 0,
          cash_settled: false,
          created_at: "2026-05-10T06:00:00.000Z",
          bookings: [
            {
              id: "booking-1",
              booking_type: "dropoff",
              status: "scheduled",
              confirmed_at: null,
              staff_confirmed_by: null,
              slot: {
                id: "slot-1",
                facility_id: "facility-1",
                slot_date: "2026-05-10",
                slot_time: "09:00:00",
                capacity: 10,
                booked_count: 1,
              },
            },
          ],
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
        error: null,
      });

      const bookingUpdateBuilder = createUpdateEqBuilder({ error: null });
      const transactionUpdateBuilder = createUpdateEqBuilder({ error: null });

      queueFromBuilders({
        transactions: [
          transactionLookupBuilder,
          transactionUpdateBuilder,
        ],
        facility_bookings: [bookingUpdateBuilder],
        trade_facilities: [
          createMaybeSingleBuilder({
            data: null,
            error: null,
          }),
        ],
      });

      const { data, error } = await advanceFacilityTransaction({
        transactionId: "tx-1",
        action: "confirm_dropoff",
        staffIdentifier: "Karabo Tlaka",
      });

      expect(error).toBeNull();
      expect(bookingUpdateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "received",
          staff_confirmed_by: "Karabo Tlaka",
          confirmed_at: expect.any(String),
        }),
      );
      expect(bookingUpdateBuilder.eq).toHaveBeenCalledWith("id", "booking-1");
      expect(transactionUpdateBuilder.update).toHaveBeenCalledWith({
        status: "item_received",
      });
      expect(transactionUpdateBuilder.eq).toHaveBeenCalledWith("id", "tx-1");
      expect(data).toEqual(
        expect.objectContaining({
          facility: null,
          slots: [],
          transactions: [],
        }),
      );
    });
  });
});
