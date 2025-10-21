export function generateInvoiceHTML(invoiceData: any, booking: any, bookingType: string): string {
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
            font-family: 'Inter', Arial, sans-serif;
            padding: 0;
            margin: 0;
            color: #3C2317;
            background-color: #FFF7E8;
          }
          .container {
            max-width: 800px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 16px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #D2A679, #F6E4C1);
            padding: 30px 40px;
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
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 10px;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .company-info h1 {
            margin: 0;
            font-size: 28px;
            color: #3C2317;
            font-weight: 700;
          }
          .company-info p {
            margin: 3px 0 0 0;
            color: #3C2317;
            opacity: 0.8;
            font-size: 14px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            margin: 0;
            font-size: 32px;
            color: #3C2317;
            font-weight: 700;
          }
          .invoice-title p {
            margin: 5px 0 0 0;
            color: #3C2317;
            opacity: 0.7;
            font-size: 13px;
            font-weight: 500;
          }
          .content {
            padding: 40px;
          }
          .details-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #FFF9F0;
            border: 1px solid #EADAC1;
            border-radius: 10px;
          }
          .bill-to h3 {
            margin: 0 0 12px 0;
            font-weight: 600;
            color: #3C2317;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .bill-to p {
            margin: 5px 0;
            font-size: 14px;
            color: #3C2317;
            line-height: 1.6;
          }
          .dates {
            text-align: right;
          }
          .date-item {
            margin-bottom: 12px;
          }
          .date-label {
            color: #8B6E58;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          .date-value {
            margin: 3px 0 0 0;
            font-weight: 600;
            color: #3C2317;
            font-size: 14px;
          }
          .info-section {
            margin-bottom: 25px;
            padding: 20px;
            background: #FDF7EC;
            border: 1px solid #EADAC1;
            border-radius: 10px;
          }
          .info-section h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #3C2317;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 14px;
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
            margin-bottom: 30px;
            border-collapse: collapse;
            border: 1px solid #EADAC1;
            border-radius: 10px;
            overflow: hidden;
          }
          thead tr {
            background: linear-gradient(90deg, #E5C79E, #F7E8C9);
          }
          th {
            text-align: left;
            padding: 14px;
            color: #3C2317;
            font-weight: 600;
            font-size: 14px;
          }
          tbody tr {
            border-bottom: 1px solid #EADAC1;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          td {
            padding: 14px;
            color: #3C2317;
            font-size: 14px;
          }
          .description {
            font-weight: 600;
          }
          .description-detail {
            font-size: 12px;
            color: #8B6E58;
            margin-top: 4px;
            line-height: 1.5;
          }
          .amount {
            text-align: right;
            font-weight: 600;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-box {
            width: 350px;
            border: 1px solid #EADAC1;
            border-radius: 10px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #EADAC1;
            color: #3C2317;
            font-size: 14px;
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
            font-size: 16px;
          }
          .total-row.final .amount {
            color: white;
          }
          .payment-status {
            padding: 20px;
            background: #FFF9F0;
            border: 1px solid #EADAC1;
            border-radius: 10px;
            margin-bottom: 30px;
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
            font-size: 16px;
            font-weight: 600;
            margin: 0;
          }
          .terms {
            margin-bottom: 30px;
            padding: 20px;
            background: #FFF9F0;
            border: 1px solid #EADAC1;
            border-radius: 10px;
          }
          .terms h4 {
            margin: 0 0 12px 0;
            color: #3C2317;
            font-weight: 600;
            font-size: 14px;
          }
          .terms p {
            margin: 6px 0;
            color: #3C2317;
            opacity: 0.8;
            font-size: 12px;
            line-height: 1.6;
          }
          .footer {
            border-top: 1px solid #EADAC1;
            padding: 25px 40px;
            text-align: center;
            background: #FDF7EC;
          }
          .footer-brand {
            font-weight: 600;
            font-size: 15px;
            color: #3C2317;
            margin: 0 0 5px 0;
          }
          .footer-license {
            font-size: 12px;
            color: #8B6E58;
            margin: 3px 0;
          }
          .footer-contact {
            font-size: 12px;
            color: #8B6E58;
            margin: 3px 0;
          }
          .footer-address {
            font-size: 11px;
            color: #8B6E58;
            margin: 8px 0 0 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <img src="https://nomadic.ae/logo.png" alt="Nomadic Logo" class="logo" onerror="this.style.display='none'">
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
                  <span class="info-label">👥 Guests:</span>
                  <span class="info-value">${booking.adults ? booking.adults + " adults" : booking.groupSize + " people"}</span>
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
                    <div class="description">${bookingType === "camping" ? "Desert Camping Experience" : "Desert Barbecue Experience"}</div>
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

            <div class="terms">
              <h4>Invoice Terms & Conditions:</h4>
              <p>• This is a digitally generated invoice and does not require a physical signature.</p>
              <p>• Payment must be received by the due date specified above.</p>
              <p>• All prices are in UAE Dirhams (AED) and include 5% VAT where applicable.</p>
              <p>• This invoice is issued by Badawi Leisure & Sport Equipment Rental (License No: 979490).</p>
              <p>• For any queries regarding this invoice, please contact us at yalla@nomadic.ae or +971 58 527 1420.</p>
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
