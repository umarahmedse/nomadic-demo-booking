import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function fmt(date: any) {
  const dv = date?.$date || date;
  if (!dv) return "Not specified";
  const d = new Date(dv);
  return isNaN(d.getTime())
    ? "Invalid date"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

export async function sendBarbecueBookingConfirmation(booking: any) {
  const bookingDate = fmt(booking.bookingDate);
  return transporter.sendMail({
    from: `"Nomadic Barbecue" <${process.env.SMTP_USER}>`,
    to: booking.customerEmail,
    subject: "🔥 Your Desert Barbecue Setup is Confirmed!",
    html: `
      <div style="font-family:Arial,sans-serif;background:#fff;color:#111;max-width:720px;margin:auto;border:1px solid #eee;border-radius:12px">
        <div style="padding:16px 20px;background:#0d9488;color:#fff;border-radius:12px 12px 0 0">
          <h2 style="margin:0">Desert Barbecue Setup – Booking Confirmation</h2>
          <p style="margin:6px 0 0">Nomadic</p>
        </div>
        <div style="padding:24px">
          <p>Dear <strong>${booking.customerName}</strong>,</p>
          <p>Thanks for booking the <strong>Nomadic Desert Barbecue Setup</strong>. Everything will be prepared before you arrive.</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border:1px solid #eee">Date</td><td style="padding:8px;border:1px solid #eee">${bookingDate}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Setup location</td><td style="padding:8px;border:1px solid #eee">40 minutes from Dubai (Al Qudra area)</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Arrival time</td><td style="padding:8px;border:1px solid #eee">6:00 PM</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Group size</td><td style="padding:8px;border:1px solid #eee">${
              booking.groupSize
            } people</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Total</td><td style="padding:8px;border:1px solid #eee"><strong>AED ${booking.total.toFixed(
              2
            )}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Status</td><td style="padding:8px;border:1px solid #eee">${
              booking.isPaid ? "✅ Paid" : "❌ Pending"
            }</td></tr>
          </table>

          <h3>What to bring</h3>
          <ul>
            <li>BBQ food & drinks</li>
            <li>Charcoal & firewood (or add to your booking)</li>
            <li>Power bank</li>
          </ul>

          <p>You'll receive an exact Google Maps pin by email once your booking is confirmed.</p>

          <p style="margin-top:24px">We look forward to hosting your unforgettable BBQ evening under the desert sky.</p>
        </div>
      </div>
    `,
  });
}

export async function sendBarbecueAdminNotification(booking: any) {
  const bookingDate = fmt(booking.bookingDate);
  return transporter.sendMail({
    from: `"Nomadic Notifications" <${process.env.SMTP_USER}>`,
    to: "umarahmedse@gmail.com",
    subject: `📩 New Barbecue Booking – ${booking.customerName}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#fff;color:#111;max-width:720px;margin:auto;border:1px solid #eee;border-radius:12px">
        <div style="padding:16px 20px;background:#0891b2;color:#fff;border-radius:12px 12px 0 0">
          <h2 style="margin:0">New Barbecue Booking</h2>
        </div>
        <div style="padding:24px">
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border:1px solid #eee">Date</td><td style="padding:8px;border:1px solid #eee">${bookingDate}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Arrival</td><td style="padding:8px;border:1px solid #eee">6:00 PM</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Group size</td><td style="padding:8px;border:1px solid #eee">${
              booking.groupSize
            }</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Customer</td><td style="padding:8px;border:1px solid #eee">${
              booking.customerName
            }</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Email</td><td style="padding:8px;border:1px solid #eee">${
              booking.customerEmail
            }</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Phone</td><td style="padding:8px;border:1px solid #eee">${
              booking.customerPhone
            }</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Total</td><td style="padding:8px;border:1px solid #eee"><strong>AED ${booking.total.toFixed(
              2
            )}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Status</td><td style="padding:8px;border:1px solid #eee">${
              booking.isPaid ? "✅ Paid" : "❌ Pending"
            }</td></tr>
          </table>
        </div>
      </div>
    `,
  });
}
