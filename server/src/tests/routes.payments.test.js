// server/src/tests/routes.payments.test.js

const mockSupabase = {
  from: jest.fn(),
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock("../services/payfastService", () => ({
  buildPaymentPayload: jest.fn(),
  verifyITN: jest.fn(),
}));

const { buildPaymentPayload } = require("../services/payfastService");
const router = require("../routes/payments");

const getHandler = (method, path) => {
  const layer = router.stack.find(
    (item) =>
      item.route && item.route.path === path && item.route.methods[method],
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createSingleBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn().mockResolvedValue(result);
  return builder;
};

const createMaybeSingleBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn().mockResolvedValue(result);
  return builder;
};

const createInsertSingleBuilder = (result) => {
  const builder = {};
  builder.insert = jest.fn(() => builder);
  builder.select = jest.fn(() => builder);
  builder.single = jest.fn().mockResolvedValue(result);
  return builder;
};

const createInsertBuilder = (result) => {
  const builder = {};
  builder.insert = jest.fn().mockResolvedValue(result);
  return builder;
};

const createLimitBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.gte = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn().mockResolvedValue(result);
  return builder;
};

const createInBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.in = jest.fn().mockResolvedValue(result);
  return builder;
};

const createCountBuilder = (result) => {
  const builder = {};
  builder.select = jest.fn(() => builder);
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

  mockSupabase.from.mockImplementation((table) => {
    if (!queues[table] || queues[table].length === 0) {
      throw new Error(`Unexpected supabase.from(${table})`);
    }

    return queues[table].shift();
  });
};

describe("payments routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /initiate returns a PayFast payload for a valid listing", async () => {
    buildPaymentPayload.mockReturnValue({
      url: "https://payfast.test",
      fields: { signature: "sig" },
    });

    queueFromBuilders({
      listings: [
        createSingleBuilder({
          data: {
            id: "listing-1",
            title: "Calculus Textbook",
            asking_price: 150,
            seller_id: "seller-1",
            status: "active",
          },
          error: null,
        }),
      ],
      profiles: [
        createSingleBuilder({
          data: { full_name: "Ada Lovelace", email: "ada@example.com" },
          error: null,
        }),
      ],
      transactions: [
        createInsertSingleBuilder({
          data: { id: "tx-1" },
          error: null,
        }),
      ],
      payments: [createInsertBuilder({ error: null })],
    });

    const handler = getHandler("post", "/initiate");
    const res = mockRes();

    await handler(
      {
        body: {
          listingId: "listing-1",
          buyerId: "buyer-1",
          onlineAmount: 100,
        },
      },
      res,
    );

    expect(buildPaymentPayload).toHaveBeenCalledWith({
      transactionId: "tx-1",
      amount: 100,
      itemName: "Calculus Textbook",
      buyerFirstName: "Ada",
      buyerLastName: "Lovelace",
      buyerEmail: "ada@example.com",
    });

    expect(res.json).toHaveBeenCalledWith({
      transactionId: "tx-1",
      cashShortfall: 50,
      payfast: {
        url: "https://payfast.test",
        fields: { signature: "sig" },
      },
    });
  });

  test("GET /slots filters out full slots and recomputes booked counts", async () => {
    queueFromBuilders({
      facility_slots: [
        createLimitBuilder({
          data: [
            {
              id: "slot-a",
              slot_date: "2099-05-11",
              slot_time: "09:00:00",
              capacity: 1,
              booked_count: 0,
            },
            {
              id: "slot-b",
              slot_date: "2099-05-11",
              slot_time: "10:00:00",
              capacity: 2,
              booked_count: 2,
            },
          ],
          error: null,
        }),
      ],

      // slot-a has 1 booking => full
      // slot-b has 0 bookings => available
      facility_bookings: [
        createInBuilder({
          data: [{ slot_id: "slot-a" }],
          error: null,
        }),
      ],
    });

    const handler = getHandler("get", "/slots/:facilityId");
    const res = mockRes();

    await handler(
      {
        params: { facilityId: "facility-1" },
        query: {},
      },
      res,
    );

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "slot-b",
        booked_count: 0,
        capacity: 2,
      }),
    ]);
  });

  test("POST /book-slot creates a collection booking", async () => {
    queueFromBuilders({
      transactions: [
        createSingleBuilder({
          data: {
            status: "confirmed",
            buyer_id: "buyer-1",
          },
          error: null,
        }),
      ],

      facility_bookings: [
        // existing collection booking
        createMaybeSingleBuilder({
          data: null,
          error: null,
        }),

        // existing dropoff booking
        createMaybeSingleBuilder({
          data: {
            slot: {
              slot_date: "2099-05-12",
              slot_time: "09:00:00",
              facility_id: "facility-1",
            },
          },
          error: null,
        }),

        // slot booking count
        createCountBuilder({
          count: 0,
          error: null,
        }),

        // insert booking
        createInsertSingleBuilder({
          data: { id: "booking-1" },
          error: null,
        }),
      ],

      facility_slots: [
        createSingleBuilder({
          data: {
            capacity: 2,
            facility_id: "facility-1",
            slot_date: "2099-05-12",
            slot_time: "10:00:00",
          },
          error: null,
        }),
      ],
    });

    const handler = getHandler("post", "/book-slot");
    const res = mockRes();

    await handler(
      {
        body: {
          transactionId: "tx-1",
          slotId: "slot-1",
          studentId: "buyer-1",
          bookingType: "collection",
        },
      },
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      bookingId: "booking-1",
    });
  });

  test("POST /book-dropoff rejects mismatched facilities", async () => {
    queueFromBuilders({
      transactions: [
        createSingleBuilder({
          data: {
            id: "tx-1",
            status: "confirmed",
            seller_id: "seller-1",
          },
          error: null,
        }),
      ],

      facility_bookings: [
        // existing dropoff booking check
        createMaybeSingleBuilder({
          data: null,
          error: null,
        }),

        // slot capacity count
        createCountBuilder({
          count: 0,
          error: null,
        }),

        // existing collection booking
        createMaybeSingleBuilder({
          data: {
            slot: {
              slot_date: "2099-05-12",
              slot_time: "11:00:00",
              facility_id: "facility-1",
            },
          },
          error: null,
        }),
      ],

      facility_slots: [
        createSingleBuilder({
          data: {
            capacity: 2,
            facility_id: "facility-2",
            slot_date: "2099-05-12",
            slot_time: "10:00:00",
          },
          error: null,
        }),
      ],
    });

    const handler = getHandler("post", "/book-dropoff");
    const res = mockRes();

    await handler(
      {
        body: {
          transactionId: "tx-1",
          slotId: "slot-9",
          sellerId: "seller-1",
        },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      error: "Drop-off must be at the same facility as the buyer's collection.",
    });
  });
});
