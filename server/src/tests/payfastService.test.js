const crypto = require("crypto");

const phpUrlencode = (value) =>
  encodeURIComponent(String(value).trim()).replace(/%20/g, "+");

const generateExpectedSignature = (params, passphrase) => {
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => `${key}=${phpUrlencode(value)}`)
    .join("&");

  const stringToHash = passphrase
    ? `${queryString}&passphrase=${phpUrlencode(passphrase)}`
    : queryString;

  return crypto.createHash("md5").update(stringToHash).digest("hex");
};

const loadPayfastService = () => {
  jest.resetModules();
  return require("../services/payfastService");
};

describe("payfastService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("buildPaymentPayload creates a live PayFast payload with notify_url and signature", () => {
    process.env.PAYFAST_SANDBOX = "false";
    process.env.PAYFAST_MERCHANT_ID = "merchant-1";
    process.env.PAYFAST_MERCHANT_KEY = "key-1";
    process.env.PAYFAST_PASSPHRASE = "secret phrase";
    process.env.CLIENT_URL = "https://client.example.com";
    process.env.SERVER_URL = "https://server.example.com";

    const { buildPaymentPayload } = loadPayfastService();

    const result = buildPaymentPayload({
      transactionId: "tx-100",
      amount: 1250,
      itemName: `  ${"A".repeat(120)}  `,
      buyerFirstName: " Amy ",
      buyerLastName: " Smith ",
      buyerEmail: "amy@example.com",
    });

    expect(result.url).toBe("https://www.payfast.co.za/eng/process");
    expect(result.fields).toMatchObject({
      merchant_id: "merchant-1",
      merchant_key: "key-1",
      return_url:
        "https://client.example.com/payment/success?transaction_id=tx-100",
      cancel_url:
        "https://client.example.com/payment/cancel?transaction_id=tx-100",
      notify_url: "https://server.example.com/api/payments/webhook",
      name_first: " Amy ",
      name_last: " Smith ",
      email_address: "amy@example.com",
      m_payment_id: "tx-100",
      amount: "1250.00",
      item_name: " ".repeat(2) + "A".repeat(98),
    });

    const { signature, ...unsignedFields } = result.fields;
    expect(signature).toBe(
      generateExpectedSignature(unsignedFields, "secret phrase"),
    );
  });

  test("buildPaymentPayload removes notify_url in sandbox mode", () => {
    process.env.PAYFAST_SANDBOX = "true";
    process.env.PAYFAST_MERCHANT_ID = "merchant-2";
    process.env.PAYFAST_MERCHANT_KEY = "key-2";
    process.env.PAYFAST_PASSPHRASE = "sandbox-secret";

    const { buildPaymentPayload } = loadPayfastService();

    const result = buildPaymentPayload({
      transactionId: "tx-200",
      amount: 85.5,
      itemName: "Campus Lamp",
      buyerFirstName: "Lebo",
      buyerLastName: "Mokoena",
      buyerEmail: "lebo@example.com",
    });

    expect(result.url).toBe("https://sandbox.payfast.co.za/eng/process");
    expect(result.fields.notify_url).toBeUndefined();

    const { signature, ...unsignedFields } = result.fields;
    expect(signature).toBe(
      generateExpectedSignature(unsignedFields, "sandbox-secret"),
    );
  });

  test("verifyITN accepts complete payments with a valid signature and rejects invalid ones", () => {
    process.env.PAYFAST_PASSPHRASE = "verify-secret";
    const { verifyITN } = loadPayfastService();

    const validPayload = {
      m_payment_id: "tx-300",
      amount_gross: "499.99",
      item_name: "Desk Chair",
      payment_status: "COMPLETE",
    };

    const validSignature = generateExpectedSignature(
      validPayload,
      "verify-secret",
    );

    expect(
      verifyITN({ ...validPayload, signature: validSignature }),
    ).toBe(true);

    expect(
      verifyITN({ ...validPayload, signature: "bad-signature" }),
    ).toBe(false);

    expect(
      verifyITN({
        ...validPayload,
        payment_status: "FAILED",
        signature: validSignature,
      }),
    ).toBe(false);
  });
});
