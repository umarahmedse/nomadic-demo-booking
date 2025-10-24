export async function generateInvoicePDF(invoiceData: any, booking: any, bookingType: "camping" | "barbecue") {
  // Create a simple HTML representation that can be printed
  const invoiceHTML = generateInvoiceHTML(invoiceData, booking, bookingType)

  // Create a new window for printing
  const printWindow = window.open("", "", "width=800,height=600")
  if (!printWindow) {
    throw new Error("Failed to open print window")
  }

  printWindow.document.write(invoiceHTML)
  printWindow.document.close()

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

function generateInvoiceHTML(invoiceData: any, booking: any, bookingType: string): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatAddOns = (addOns: any) => {
    if (!addOns || Object.keys(addOns).length === 0) return '<em style="color:#8B6E58;">None</em>'

    const list = Object.entries(addOns)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const label =
          key === "charcoal"
            ? "🔥 Charcoal"
            : key === "firewood"
              ? "🪵 Firewood"
              : key === "portableToilet"
                ? "🚻 Portable Toilet"
                : key
        return label
      })
      .join(", ")

    return list || '<em style="color:#8B6E58;">None</em>'
  }

  const formatSleeping = (arrangements: any[]) => {
    if (!arrangements?.length) return '<em style="color:#8B6E58;">Not specified</em>'

    const filtered = arrangements.filter((a) => a.arrangement !== "custom")
    if (!filtered.length) return '<em style="color:#8B6E58;">Not specified</em>'

    return filtered
      .map((a) => {
        const arr =
          a.arrangement === "all-singles"
            ? "All Single Beds (4 singles)"
            : a.arrangement === "two-doubles"
              ? "Two Double Beds (2 doubles)"
              : a.arrangement === "mix"
                ? "Mixed (1 double + 2 singles)"
                : a.arrangement === "double-bed"
                  ? "Double Bed (1 double)"
                  : a.arrangement
        return `Tent ${a.tentNumber}: ${arr}`
      })
      .join("<br>")
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${invoiceData.invoiceNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Inter', Arial, sans-serif;
            padding: 0;
            margin: 0;
            color: #3C2317;
            background-color: #FFF7E8;
          }
          .container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 16px rgba(0,0,0,0.08);
            box-sizing: border-box;
          }
          .header {
            background: linear-gradient(135deg, #D2A679, #F6E4C1);
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 8px;
            padding: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            object-fit: contain;
          }
          .company-info h1 {
            margin: 0;
            font-size: 22px;
            color: #3C2317;
            font-weight: 700;
          }
          .company-info p {
            margin: 2px 0 0 0;
            color: #3C2317;
            opacity: 0.8;
            font-size: 12px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            margin: 0;
            font-size: 26px;
            color: #3C2317;
            font-weight: 700;
          }
          .invoice-title p {
            margin: 4px 0 0 0;
            color: #3C2317;
            opacity: 0.7;
            font-size: 12px;
            font-weight: 500;
          }
          .content {
            padding: 25px 30px;
          }
          .details-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background: #FFF9F0;
            border: 1px solid #EADAC1;
            border-radius: 8px;
          }
          .bill-to h3 {
            margin: 0 0 8px 0;
            font-weight: 600;
            color: #3C2317;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .bill-to p {
            margin: 4px 0;
            font-size: 13px;
            color: #3C2317;
            line-height: 1.5;
          }
          .dates {
            text-align: right;
          }
          .date-item {
            margin-bottom: 8px;
          }
          .date-label {
            color: #8B6E58;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          .date-value {
            margin: 2px 0 0 0;
            font-weight: 600;
            color: #3C2317;
            font-size: 13px;
          }
          .info-section {
            margin-bottom: 18px;
            padding: 15px;
            background: #FDF7EC;
            border: 1px solid #EADAC1;
            border-radius: 8px;
          }
          .info-section h3 {
            margin: 0 0 12px 0;
            font-size: 15px;
            color: #3C2317;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 13px;
          }
          .info-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-label {
            color: #8B6E58;
            font-weight: 600;
          }
          .info-value {
            color: #3C2317;
          }
          table {
            width: 100%;
            margin-bottom: 18px;
            border-collapse: collapse;
            border: 1px solid #EADAC1;
            border-radius: 8px;
            overflow: hidden;
          }
          thead tr {
            background: linear-gradient(90deg, #E5C79E, #F7E8C9);
          }
          th {
            text-align: left;
            padding: 10px 12px;
            color: #3C2317;
            font-weight: 600;
            font-size: 13px;
          }
          tbody tr {
            border-bottom: 1px solid #EADAC1;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          td {
            padding: 10px 12px;
            color: #3C2317;
            font-size: 13px;
          }
          .description {
            font-weight: 600;
          }
          .description-detail {
            font-size: 11px;
            color: #8B6E58;
            margin-top: 3px;
            line-height: 1.4;
          }
          .amount {
            text-align: right;
            font-weight: 600;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 18px;
          }
          .totals-box {
            width: 320px;
            border: 1px solid #EADAC1;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 14px;
            border-bottom: 1px solid #EADAC1;
            color: #3C2317;
            font-size: 13px;
          }
          .total-row:last-child {
            border-bottom: none;
          }
          .total-row.subtotal {
            background: #FDF7EC;
          }
          .total-row.final {
            background: linear-gradient(90deg, #1B8F5A, #2BC480);
            color: white;
            font-weight: 700;
            font-size: 15px;
          }
          .total-row.final .amount {
            color: white;
          }
          .payment-status {
            padding: 12px;
            background: #FFF9F0;
            border: 1px solid #EADAC1;
            border-radius: 8px;
            margin-bottom: 18px;
            text-align: center;
          }
          .payment-status.paid {
            background: #E8F5E9;
            border-color: #2BC480;
          }
          .payment-status.unpaid {
            background: #FFF3E0;
            border-color: #FF9800;
          }
          .payment-status-text {
            font-size: 14px;
            font-weight: 600;
            margin: 0;
          }
          .terms {
            margin-bottom: 18px;
            padding: 12px 15px;
            background: #FFF9F0;
            border: 1px solid #EADAC1;
            border-radius: 8px;
          }
          .terms h4 {
            margin: 0 0 8px 0;
            color: #3C2317;
            font-weight: 600;
            font-size: 13px;
          }
          .terms p {
            margin: 4px 0;
            color: #3C2317;
            opacity: 0.8;
            font-size: 11px;
            line-height: 1.5;
          }
          .footer {
            border-top: 1px solid #EADAC1;
            padding: 15px 30px;
            text-align: center;
            background: #FDF7EC;
          }
          .footer-brand {
            font-weight: 600;
            font-size: 14px;
            color: #3C2317;
            margin: 0 0 4px 0;
          }
          .footer-license {
            font-size: 11px;
            color: #8B6E58;
            margin: 2px 0;
          }
          .footer-contact {
            font-size: 11px;
            color: #8B6E58;
            margin: 2px 0;
          }
          .footer-address {
            font-size: 10px;
            color: #8B6E58;
            margin: 6px 0 0 0;
          }
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .container {
              margin: 0 !important;
              box-shadow: none !important;
              max-width: 100% !important;
              width: 210mm !important;
              height: 297mm !important;
              border-radius: 0 !important;
              page-break-after: avoid !important;
            }
            .header {
              background: linear-gradient(135deg, #D2A679, #F6E4C1) !important;
            }
            .info-section {
              background: #FDF7EC !important;
              border: 1px solid #EADAC1 !important;
            }
            .details-grid {
              background: #FFF9F0 !important;
              border: 1px solid #EADAC1 !important;
            }
            thead tr {
              background: linear-gradient(90deg, #E5C79E, #F7E8C9) !important;
            }
            .total-row.subtotal {
              background: #FDF7EC !important;
            }
            .total-row.final {
              background: linear-gradient(90deg, #1B8F5A, #2BC480) !important;
              color: white !important;
            }
            .payment-status {
              background: #FFF9F0 !important;
              border: 1px solid #EADAC1 !important;
            }
            .payment-status.paid {
              background: #E8F5E9 !important;
              border-color: #2BC480 !important;
            }
            .payment-status.unpaid {
              background: #FFF3E0 !important;
              border-color: #FF9800 !important;
            }
            .terms {
              background: #FFF9F0 !important;
              border: 1px solid #EADAC1 !important;
            }
            .footer {
              background: #FDF7EC !important;
              border-top: 1px solid #EADAC1 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <img src="${typeof window !== "undefined" ? window.location.origin : ""}/logo.png" alt="Nomadic Logo" class="logo" onerror="this.style.display='none'">
              <div class="company-info">
                <h1>NOMADIC بدوي</h1>
                <p>Glamping & Desert Experiences</p>
              </div>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p>${invoiceData.invoiceNumber}</p>
            </div>
          </div>

          <div class="content">
            <div class="details-grid">
              <div class="bill-to">
                <h3>Bill To:</h3>
                <p><strong>${invoiceData.customerName}</strong></p>
                <p>📧 ${invoiceData.customerEmail}</p>
                <p>📞 ${invoiceData.customerPhone}</p>
              </div>
              <div class="dates">
                <div class="date-item">
                  <div class="date-label">Invoice Date</div>
                  <div class="date-value">${formatDate(invoiceData.invoiceDate)}</div>
                </div>
                <div class="date-item">
                  <div class="date-label">Due Date</div>
                  <div class="date-value">${formatDate(invoiceData.dueDate)}</div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>Booking Details</h3>
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">📅 Date:</span>
                  <span class="info-value">${formatDate(invoiceData.bookingDate)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📍 Location:</span>
                  <span class="info-value">${booking.location || booking.groupSize}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">🕓 Arrival:</span>
                  <span class="info-value">${booking.arrivalTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">👨‍👩‍👧 Guests:</span>
                  <span class="info-value">${booking.adults ? booking.adults + " adults" : booking.groupSize + " people"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">⛺ Tents:</span>
                  <span class="info-value">${booking.numberOfTents}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">🛏️ Sleeping:</span>
                  <span class="info-value">${formatSleeping(booking.sleepingArrangements)}</span>
                </div>
              </div>
              <div style="margin-top: 12px;">
                <span class="info-label">Add-ons:</span>
                <span class="info-value">${formatAddOns(booking.addOns)}</span>
              </div>
              ${
                booking.specialPricingName
                  ? `
              <div style="margin-top: 12px; padding: 10px; background: #FFF3E0; border-left: 3px solid #FF9800; border-radius: 4px;">
                <span class="info-label">🎉 Special Event:</span>
                <span class="info-value" style="color: #FF9800; font-weight: 600;">${booking.specialPricingName}</span>
              </div>
              `
                  : ""
              }
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="description">${bookingType === "camping" ? "Desert Camping Experience" : "Desert Barbecue Experience"}</div>
                    <div class="description-detail">
                      ${booking.numberOfTents ? `${booking.numberOfTents} tent(s) for ${booking.adults} adults${booking.children ? ` and ${booking.children} children` : ""}` : `${booking.groupSize} people`}<br>
                      Location: ${booking.location} | Arrival: ${booking.arrivalTime}
                    </div>
                  </td>
                  <td class="amount">AED ${invoiceData.subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-box">
                <div class="total-row subtotal">
                  <span>Subtotal:</span>
                  <span class="amount">AED ${invoiceData.subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>VAT (5%):</span>
                  <span class="amount">AED ${invoiceData.vat.toFixed(2)}</span>
                </div>
                <div class="total-row final">
                  <span>TOTAL DUE:</span>
                  <span class="amount">AED ${invoiceData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="payment-status ${booking.isPaid ? "paid" : "unpaid"}">
              <p class="payment-status-text">
                ${booking.isPaid ? "✅ PAID" : "⏳ PAYMENT PENDING"}
              </p>
            </div>

            ${
              invoiceData.notes
                ? `
            <div class="terms">
              <h4>Additional Notes:</h4>
              <p>${invoiceData.notes}</p>
            </div>
            `
                : ""
            }

            <div class="terms">   
              <p>This is a digitally generated invoice and does not require a physical signature.</p>
            </div>
          </div>

          <div class="footer">
            <p class="footer-brand">Nomadic بدوي</p>
            <p class="footer-license">Commercial Manager – Badawi Leisure & Sport Equipment Rental | License No: 979490</p>
            <p class="footer-contact">📞 0585271420 | ✉️ yalla@nomadic.ae | 🌐 www.nomadic.ae</p>
            <p class="footer-address">🏢 Empire Heights A, 9th Floor, Business Bay, Dubai</p>
          </div>
        </div>
      </body>
    </html>
  `
}
