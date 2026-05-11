// server/src/services/payfastService.js
const crypto = require("crypto");

const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL    = "https://www.payfast.co.za/eng/process";
const IS_SANDBOX = process.env.NODE_ENV !== "production";

/**
 * PHP-style urlencode — PayFast is built in PHP and expects spaces as '+'
 * not '%20'. Using encodeURIComponent breaks the signature.
 */
function phpUrlencode(value) {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

/**
 * Generates the PayFast MD5 signature.
 * Field ORDER matters — do not sort or rearrange.
 */
function generateSignature(params, passphrase) {
  const queryString = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${phpUrlencode(v)}`)
    .join("&");

  const stringToHash = passphrase
    ? `${queryString}&passphrase=${phpUrlencode(passphrase)}`
    : queryString;

  return crypto.createHash("md5").update(stringToHash).digest("hex");
}

/**
 * Builds the PayFast payment payload.
 * Returns { url, fields } — fields go into a hidden POST form on the frontend.
 */
function buildPaymentPayload({
  transactionId,
  amount,
  itemName,
  buyerFirstName,
  buyerLastName,
  buyerEmail,
}) {
  const merchantId  = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase  = process.env.PAYFAST_PASSPHRASE;
  const baseUrl     = process.env.CLIENT_URL  || "http://localhost:5173";
  const serverUrl   = process.env.SERVER_URL  || "http://localhost:8080";

  // ⚠️ Field order is critical — PayFast validates the signature in this order
  const params = {
    merchant_id:   merchantId,
    merchant_key:  merchantKey,
    return_url:    `${baseUrl}/payment/success?transaction_id=${transactionId}`,
    cancel_url:    `${baseUrl}/payment/cancel?transaction_id=${transactionId}`,
    notify_url:    IS_SANDBOX ? "" : `${serverUrl}/api/payments/webhook`,
    name_first:    buyerFirstName,
    name_last:     buyerLastName,
    email_address: buyerEmail,
    m_payment_id:  transactionId,
    amount:        Number(amount).toFixed(2),
    item_name:     String(itemName).slice(0, 100),
  };

  // Remove notify_url entirely in sandbox — PayFast sandbox ignores it anyway
  if (IS_SANDBOX) delete params.notify_url;

  const signature = generateSignature(params, passphrase);

  return {
    url:    IS_SANDBOX ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL,
    fields: { ...params, signature },
  };
}

/**
 * Verifies an incoming ITN from PayFast (production only).
 */
function verifyITN(itnData) {
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const { signature: received, ...rest } = itnData;
  const expected = generateSignature(rest, passphrase);
  return expected === received && itnData.payment_status === "COMPLETE";
}

module.exports = { buildPaymentPayload, verifyITN };