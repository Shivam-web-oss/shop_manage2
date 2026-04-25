"use client"

import { useMemo, useRef } from "react"

// Keep a minimum number of table rows so the printed bill always has a balanced layout.
const MIN_PRINT_ROWS = 8

// Reuse one currency formatter everywhere so all rupee values look the same.
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// These styles are injected into the page and also into the print popup window.
const PRINT_STYLES = `
  :root {
    color-scheme: light;
  }

  body.invoice-print-body {
    margin: 0;
    padding: 24px;
    background: #eef4f8;
    font-family: "Segoe UI", Arial, sans-serif;
    color: #0f172a;
  }

  .invoice-shell {
    width: 100%;
  }

  .invoice-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 16px;
  }

  .invoice-button {
    border: none;
    border-radius: 999px;
    background: #1f7a53;
    color: #ffffff;
    cursor: pointer;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 20px;
  }

  .invoice-sheet {
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #0f172a;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 28px 20px;
    border-bottom: 2px solid #0f172a;
    background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  }

  .invoice-eyebrow {
    margin: 0 0 8px;
    color: #1f7a53;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .invoice-title {
    margin: 0;
    font-size: 30px;
    line-height: 1.1;
  }

  .invoice-subtitle {
    margin: 8px 0 0;
    color: #334155;
    font-size: 18px;
    font-weight: 600;
  }

  .invoice-address {
    margin: 10px 0 0;
    color: #475569;
    font-size: 14px;
    line-height: 1.6;
    max-width: 520px;
  }

  .invoice-badge {
    min-width: 200px;
    border: 1px solid #cbd5e1;
    border-radius: 18px;
    padding: 16px 18px;
    background: #ffffff;
  }

  .invoice-badge-label {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .invoice-badge-value {
    margin: 10px 0 0;
    font-size: 24px;
    font-weight: 700;
  }

  .invoice-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    border-bottom: 1px solid #cbd5e1;
  }

  .invoice-meta-card {
    padding: 18px 28px;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }

  .invoice-meta-card:nth-child(2n) {
    border-right: none;
  }

  .invoice-meta-label {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .invoice-meta-value {
    margin: 10px 0 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    word-break: break-word;
  }

  .invoice-table-wrap {
    padding: 22px 28px 0;
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .invoice-table th,
  .invoice-table td {
    border: 1px solid #cbd5e1;
    padding: 12px 10px;
    font-size: 14px;
    vertical-align: top;
  }

  .invoice-table th {
    background: #0f172a;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .invoice-col-no {
    width: 58px;
    text-align: center;
  }

  .invoice-col-qty {
    width: 90px;
    text-align: center;
  }

  .invoice-col-rate,
  .invoice-col-amount {
    width: 140px;
    text-align: right;
  }

  .invoice-empty-row td {
    height: 46px;
  }

  .invoice-summary-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
    gap: 24px;
    padding: 22px 28px 0;
  }

  .invoice-words-card,
  .invoice-summary-card {
    border: 1px solid #cbd5e1;
    border-radius: 20px;
    background: #f8fafc;
    padding: 18px 20px;
  }

  .invoice-summary-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 0;
    font-size: 14px;
  }

  .invoice-summary-row + .invoice-summary-row {
    border-top: 1px solid #e2e8f0;
  }

  .invoice-summary-total {
    font-size: 16px;
    font-weight: 700;
  }

  .invoice-words-label {
    margin: 0 0 10px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .invoice-words-value {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.6;
  }

  .invoice-footer {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 22px 28px 28px;
    align-items: flex-end;
  }

  .invoice-payment {
    color: #475569;
    font-size: 14px;
    line-height: 1.6;
  }

  .invoice-signature {
    min-width: 260px;
    text-align: right;
  }

  .invoice-signature-company {
    font-size: 14px;
    font-weight: 700;
  }

  .invoice-signature-line {
    margin: 42px 0 8px auto;
    width: 220px;
    border-top: 1px solid #0f172a;
  }

  .invoice-signature-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  @media (max-width: 840px) {
    body.invoice-print-body {
      padding: 12px;
    }

    .invoice-header,
    .invoice-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .invoice-meta,
    .invoice-summary-wrap {
      grid-template-columns: 1fr;
    }

    .invoice-meta-card {
      border-right: none;
    }

    .invoice-badge,
    .invoice-signature {
      min-width: 0;
      width: 100%;
    }

    .invoice-signature {
      text-align: left;
    }

    .invoice-signature-line {
      margin-left: 0;
    }
  }

  @media print {
    body.invoice-print-body {
      padding: 0;
      background: #ffffff;
    }

    .invoice-sheet {
      max-width: none;
      box-shadow: none;
      border: none;
    }
  }
`

// Convert any number-like value into a properly formatted INR currency string.
function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0))
}

// Show only the date part of a value in Indian date format.
function formatDate(value) {
  // If no date is provided, we fall back to the current date.
  const date = value ? new Date(value) : new Date()

  // Guard against invalid date values so the UI does not break.
  if (Number.isNaN(date.getTime())) {
    return "N/A"
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Show both date and time for fields such as bill creation time.
function formatDateTime(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return "N/A"
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Round money values to 2 decimal places so totals stay predictable.
function roundAmount(value) {
  return Number(Number(value ?? 0).toFixed(2))
}

// Convert raw bill items into safe, printable rows and pad empty rows for printing.
function normalizePrintRows(items = []) {
  const normalizedRows = items.map((item) => {
    // Pull the important values from each item and make sure they are numbers.
    const quantity = Number(item?.quantity ?? 0)
    const rate = Number(item?.unit_price ?? 0)
    const amount = Number(item?.total_price ?? quantity * rate)

    return {
      description: String(item?.product_name ?? "").trim(),
      quantity,
      rate,
      amount,
    }
  })

  // Add blank rows so short bills still fill the printed table nicely.
  while (normalizedRows.length < MIN_PRINT_ROWS) {
    normalizedRows.push({
      description: "",
      quantity: null,
      rate: null,
      amount: null,
    })
  }

  return normalizedRows
}

// Turn values like "credit_card" into "Credit Card" for a friendlier display.
function capitalizeWords(value) {
  return String(value ?? "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

// Normalize payment mode text and keep common values like UPI nicely formatted.
function formatPaymentMethod(value) {
  const normalizedValue = String(value ?? "").trim()
  if (!normalizedValue) {
    return "Cash"
  }

  if (normalizedValue.toLowerCase() === "upi") {
    return "UPI"
  }

  return capitalizeWords(normalizedValue)
}

// Word lookup for numbers below twenty.
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]

// Word lookup for multiples of ten.
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

// Convert a number from 0 to 999 into words.
function numberToWordsUnderOneThousand(value) {
  const normalizedValue = Math.floor(Math.abs(value))

  if (normalizedValue < 20) {
    return ONES[normalizedValue]
  }

  if (normalizedValue < 100) {
    return `${TENS[Math.floor(normalizedValue / 10)]}${normalizedValue % 10 ? ` ${ONES[normalizedValue % 10]}` : ""}`
  }

  return `${ONES[Math.floor(normalizedValue / 100)]} Hundred${
    normalizedValue % 100 ? ` ${numberToWordsUnderOneThousand(normalizedValue % 100)}` : ""
  }`
}

// Convert a whole number into Indian numbering words like Thousand, Lakh, and Crore.
function numberToWordsIndian(value) {
  const normalizedValue = Math.floor(Math.abs(value))

  if (normalizedValue === 0) {
    return "Zero"
  }

  const units = [
    { value: 10000000, label: "Crore" },
    { value: 100000, label: "Lakh" },
    { value: 1000, label: "Thousand" },
  ]

  let remainingValue = normalizedValue
  const parts = []

  for (const unit of units) {
    if (remainingValue >= unit.value) {
      const unitAmount = Math.floor(remainingValue / unit.value)
      parts.push(`${numberToWordsUnderOneThousand(unitAmount)} ${unit.label}`)
      remainingValue %= unit.value
    }
  }

  if (remainingValue > 0) {
    parts.push(numberToWordsUnderOneThousand(remainingValue))
  }

  return parts.join(" ").trim()
}

// Convert a final money amount into a sentence such as "One Hundred Rupees Only".
function amountToWords(value) {
  const roundedValue = roundAmount(value)
  // Separate rupees and paise so both can be written correctly.
  const wholeRupees = Math.floor(roundedValue)
  const paise = Math.round((roundedValue - wholeRupees) * 100)

  let result = `${numberToWordsIndian(wholeRupees)} Rupees`
  if (paise > 0) {
    result += ` and ${numberToWordsIndian(paise)} Paise`
  }

  return `${result} Only`
}

// Create a short readable bill number from the raw bill id.
function getBillNumber(value) {
  const normalizedValue = String(value ?? "").trim()
  if (!normalizedValue) {
    return "N/A"
  }

  return normalizedValue.slice(0, 8).toUpperCase()
}

// `bill` contains all invoice data to display.
// `showActions` decides whether the print button should be shown.
export default function BillTemplate({ bill, showActions = true }) {
  // This ref points to the invoice DOM so we can copy it into the print window.
  const printRef = useRef(null)

  // Prepare printable rows once and recalculate only when the bill items change.
  const printableRows = useMemo(() => normalizePrintRows(bill?.items ?? []), [bill?.items])

  // If there is no bill yet, render nothing.
  if (!bill) {
    return null
  }

  // Build display-friendly values with safe fallbacks so missing fields do not show as undefined.
  const companyName = String(bill.company_name ?? "").trim() || "Business"
  const shopName = String(bill.shop_name ?? "").trim()
  const shopLocation = String(bill.shop_location ?? "").trim()
  const customerName = String(bill.customer_name ?? "").trim() || "Walk-in"
  const customerPhone = String(bill.customer_phone ?? "").trim() || "N/A"
  const customerAddress = String(bill.customer_address ?? "").trim() || "N/A"
  const subtotal = roundAmount(bill.subtotal ?? 0)
  const discountAmount = roundAmount(bill.discount_amount ?? 0)
  const taxableAmount = roundAmount(bill.taxable_amount ?? subtotal - discountAmount)
  const gstAmount = roundAmount(bill.gst_amount ?? 0)
  const cgstAmount = roundAmount(bill.cgst_amount ?? gstAmount / 2)
  const sgstAmount = roundAmount(bill.sgst_amount ?? gstAmount - cgstAmount)
  const totalAmount = roundAmount(bill.total_amount ?? taxableAmount + gstAmount)
  const amountInWords = amountToWords(totalAmount)
  const billNumber = getBillNumber(bill.id)
  const paymentMethod = formatPaymentMethod(bill.payment_method)

  // Show the shop name as a subtitle only when it is different from the company name.
  const secondaryTitle = shopName && shopName !== companyName ? shopName : ""

  // Open a temporary browser window, copy the invoice HTML into it, and trigger printing.
  function handlePrint() {
    if (!printRef.current) {
      return
    }

    // Create a popup window that will contain only the printable invoice.
    const printWindow = window.open("", "_blank", "width=980,height=720")
    if (!printWindow) {
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Bill ${billNumber}</title>
          <style>${PRINT_STYLES}</style>
        </head>
        <body class="invoice-print-body">
          ${printRef.current.outerHTML}
        </body>
      </html>`)
    printWindow.document.close()

    // Give the browser a short moment to finish rendering before calling print.
    window.setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return (
    <div className="invoice-shell">
      {/* Use the same CSS for on-screen preview and the copied print window. */}
      <style>{PRINT_STYLES}</style>

      {/* The action bar is optional because some places may want a read-only bill view. */}
      {showActions ? (
        <div className="invoice-toolbar">
          <button type="button" onClick={handlePrint} className="invoice-button">
            Print Bill
          </button>
        </div>
      ) : null}

      {/* This full section is what gets printed when the user clicks "Print Bill". */}
      <div ref={printRef} className="invoice-sheet">
        {/* Top section with business identity and the main bill badge. */}
        <div className="invoice-header">
          <div>
            <p className="invoice-eyebrow">Tax Invoice</p>
            <h2 className="invoice-title">{companyName}</h2>
            {secondaryTitle ? <p className="invoice-subtitle">{secondaryTitle}</p> : null}
            {shopLocation ? <p className="invoice-address">{shopLocation}</p> : null}
          </div>

          <div className="invoice-badge">
            <p className="invoice-badge-label">Bill Number</p>
            <p className="invoice-badge-value">{billNumber}</p>
            <p className="invoice-badge-label" style={{ marginTop: "14px" }}>
              Created
            </p>
            <p className="invoice-meta-value" style={{ marginTop: "8px", fontSize: "15px" }}>
              {formatDateTime(bill.created_at)}
            </p>
          </div>
        </div>

        {/* Quick customer and payment details. */}
        <div className="invoice-meta">
          <div className="invoice-meta-card">
            <p className="invoice-meta-label">Date</p>
            <p className="invoice-meta-value">{formatDate(bill.created_at)}</p>
          </div>
          <div className="invoice-meta-card">
            <p className="invoice-meta-label">Payment Mode</p>
            <p className="invoice-meta-value">{paymentMethod}</p>
          </div>
          <div className="invoice-meta-card">
            <p className="invoice-meta-label">Customer Name</p>
            <p className="invoice-meta-value">{customerName}</p>
          </div>
          <div className="invoice-meta-card">
            <p className="invoice-meta-label">Mobile</p>
            <p className="invoice-meta-value">{customerPhone}</p>
          </div>
          <div className="invoice-meta-card" style={{ gridColumn: "1 / -1", borderRight: "none" }}>
            <p className="invoice-meta-label">Address</p>
            <p className="invoice-meta-value">{customerAddress}</p>
          </div>
        </div>

        {/* Item table showing each purchased product and its pricing. */}
        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="invoice-col-no">No.</th>
                <th>Particular</th>
                <th className="invoice-col-qty">Qty</th>
                <th className="invoice-col-rate">Rate</th>
                <th className="invoice-col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {printableRows.map((row, index) => (
                // Empty padded rows keep the printed bill height consistent.
                <tr key={`${row.description}-${index}`} className={!row.description ? "invoice-empty-row" : ""}>
                  <td className="invoice-col-no">{row.description ? index + 1 : ""}</td>
                  <td>{row.description}</td>
                  <td className="invoice-col-qty">{row.quantity ? row.quantity : ""}</td>
                  <td className="invoice-col-rate">{row.rate ? formatCurrency(row.rate) : ""}</td>
                  <td className="invoice-col-amount">{row.amount ? formatCurrency(row.amount) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom summary with words and tax breakdown. */}
        <div className="invoice-summary-wrap">
          <div className="invoice-words-card">
            <p className="invoice-words-label">Amount In Words</p>
            <p className="invoice-words-value">{amountInWords}</p>
          </div>

          <div className="invoice-summary-card">
            <div className="invoice-summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="invoice-summary-row">
              <span>Discount</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="invoice-summary-row">
              <span>Taxable Amount</span>
              <span>{formatCurrency(taxableAmount)}</span>
            </div>
            <div className="invoice-summary-row">
              <span>CGST (9%)</span>
              <span>{formatCurrency(cgstAmount)}</span>
            </div>
            <div className="invoice-summary-row">
              <span>SGST (9%)</span>
              <span>{formatCurrency(sgstAmount)}</span>
            </div>
            <div className="invoice-summary-row invoice-summary-total">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer shows payment status and the signature area. */}
        <div className="invoice-footer">
          <div className="invoice-payment">
            <div>Status: {capitalizeWords(bill.status ?? "paid")}</div>
            <div>Generated on: {formatDateTime(bill.created_at)}</div>
          </div>

          <div className="invoice-signature">
            <div className="invoice-signature-company">For {companyName}</div>
            <div className="invoice-signature-line" />
            <div className="invoice-signature-label">Authorised Signature</div>
          </div>
        </div>
      </div>
    </div>
  )
}
