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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${invoiceData.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #3C2317;
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #D3B88C;
          }
          .company-info h1 {
            margin: 0;
            font-size: 32px;
            color: #3C2317;
          }
          .company-info p {
            margin: 5px 0 0 0;
            color: #3C2317;
            opacity: 0.7;
            font-size: 14px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            margin: 0;
            font-size: 28px;
            color: #3C2317;
          }
          .invoice-title p {
            margin: 5px 0 0 0;
            color: #3C2317;
            opacity: 0.7;
            font-size: 14px;
          }
          .details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .bill-to h3 {
            margin: 0 0 15px 0;
            font-weight: bold;
            color: #3C2317;
          }
          .bill-to p {
            margin: 0;
            font-size: 14px;
            color: #3C2317;
            opacity: 0.8;
            line-height: 1.6;
          }
          .dates {
            text-align: right;
            font-size: 13px;
          }
          .date-item {
            margin-bottom: 10px;
          }
          .date-label {
            color: #3C2317;
            opacity: 0.7;
          }
          .date-value {
            margin: 3px 0 0 0;
            font-weight: bold;
            color: #3C2317;
          }
          table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          thead tr {
            border-bottom: 2px solid #D3B88C;
            background-color: #FBF9D9;
          }
          th {
            text-align: left;
            padding: 12px;
            color: #3C2317;
            font-weight: bold;
          }
          tbody tr {
            border-bottom: 1px solid #D3B88C;
          }
          td {
            padding: 12px;
            color: #3C2317;
          }
          .description {
            font-weight: bold;
          }
          .description-detail {
            font-size: 12px;
            color: #3C2317;
            opacity: 0.7;
            margin-top: 3px;
          }
          .amount {
            text-align: right;
            font-weight: bold;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-box {
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #D3B88C;
            color: #3C2317;
          }
          .total-row.final {
            padding: 12px;
            background-color: #FBF9D9;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
            border: none;
          }
          .total-row.final .amount {
            color: #0891b2;
          }
          .notes {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #FBF9D9;
            border-radius: 4px;
            border: 1px solid #D3B88C;
          }
          .notes h4 {
            margin: 0 0 10px 0;
            color: #3C2317;
            font-weight: bold;
          }
          .notes p {
            margin: 0;
            color: #3C2317;
            opacity: 0.8;
            font-size: 13px;
            white-space: pre-wrap;
          }
          .footer {
            border-top: 2px solid #D3B88C;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #3C2317;
            opacity: 0.7;
          }
          .footer p {
            margin: 0;
          }
          .footer p:first-child {
            margin-bottom: 10px;
          }
          .footer p:last-child {
            margin-top: 5px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>NOMADIC</h1>
            <p>Glamping & Desert Experiences</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>${invoiceData.invoiceNumber}</p>
          </div>
        </div>

        <div class="details">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${invoiceData.customerName}</strong></p>
            <p>${invoiceData.customerEmail}</p>
            <p>${invoiceData.customerPhone}</p>
          </div>
          <div class="dates">
            <div class="date-item">
              <div class="date-label">Invoice Date:</div>
              <div class="date-value">${formatDate(invoiceData.invoiceDate)}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Due Date:</div>
              <div class="date-value">${formatDate(invoiceData.dueDate)}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Booking Date:</div>
              <div class="date-value">${formatDate(invoiceData.bookingDate)}</div>
            </div>
          </div>
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
                <div class="description">${bookingType === "camping" ? "Desert Camping" : "Desert Barbecue"} Booking</div>
                <div class="description-detail">
                  ${booking.numberOfTents ? `${booking.numberOfTents} tent(s)` : `${booking.groupSize} people`}
                </div>
              </td>
              <td class="amount">AED ${invoiceData.subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span class="amount">AED ${invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>VAT (5%):</span>
              <span class="amount">AED ${invoiceData.vat.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Total:</span>
              <span class="amount">AED ${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        ${
          invoiceData.notes
            ? `
        <div class="notes">
          <h4>Notes:</h4>
          <p>${invoiceData.notes}</p>
        </div>
      `
            : ""
        }

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Nomadic - Glamping & Desert Experiences</p>
          <p>📞 0585271420 | ✉️ yalla@nomadic.ae | 🌐 www.nomadic.ae</p>
        </div>
      </body>
    </html>
  `
}
