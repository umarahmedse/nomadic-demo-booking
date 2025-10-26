import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function formatDate(value: any) {
  const dateValue = value?.$date || value;
  if (!dateValue) return "Not specified";
  const date = new Date(dateValue);
  return isNaN(date.getTime())
    ? "Invalid date"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

export async function sendBarbecueBookingConfirmation(booking: any) {
  const bookingDate = formatDate(booking.bookingDate);

  const infoSection = `
  <div style="margin-top:25px;background:#FFF9F0;border:1px solid #EADAC1;border-radius:10px;padding:20px;color:#3C2317;line-height:1.6;font-size:15px;">
    <h3 style="color:#3C2317;margin-bottom:10px;">Meeting Point</h3>
    
    <h4 style="color:#3C2317;margin-top:15px;margin-bottom:8px;">Getting There</h4>
    <ul style="margin:0 0 15px 0;padding-left:20px;">
    <li>Please find the meeting point location above. The meeting point is accessible by any vehicle</li>
      <li>Park at the meeting point - our team will transfer you and your belongings to your setup.</li>
      <li><strong>Have a 4x4?</strong> You can drive directly to your setup.</li>
    </ul>


    <h4 style="color:#3C2317;margin-top:15px;margin-bottom:8px;">What to Bring</h4>
    <ul style="margin:0 0 15px 0;padding-left:20px;">
      <li>🍖 BBQ food & drinks</li>
      <li>🔥 Charcoal & firewood (if you haven’t booked this as an add-on)</li>
    </ul>

    <h4 style="color:#3C2317;margin-top:15px;margin-bottom:8px;">Clothing</h4>
    <p>Bring warm jumpers for the evening, especially in December–January when it can get cold. The campfire will keep you cozy as the night cools 🔥</p>

    <h4 style="color:#3C2317;margin-top:15px;margin-bottom:8px;">Environmental Responsibility 🌿</h4>
    <p>Help us keep the desert beautiful. Please take all trash with you after your experience. Bin bags are provided. <strong>#LeaveNoTrace</strong></p>

    <h3 style="color:#3C2317;margin-top:20px;margin-bottom:10px;">Itinerary</h3>
    <div style="margin-bottom:12px;">
      <strong style="color:#1B8F5A;">18:00 – Arrival at Meeting Point</strong>
      <p style="margin:4px 0 0 0;font-size:14px;">Meet your Nomadic team leader at the designated meeting point (see confirmation email upon booking).</p>
    </div>
    <div style="margin-bottom:12px;">
      <strong style="color:#1B8F5A;">Park and Transfer, or Drive Your Own 4x4</strong>
      <p style="margin:4px 0 0 0;font-size:14px;">If you don't have a 4x4, our team will transport you and your belongings to your private BBQ setup.</p>
    </div>
    <div style="margin-bottom:12px;">
      <strong style="color:#1B8F5A;">Setup Walkthrough & Safety Briefing</strong>
      <p style="margin:4px 0 0 0;font-size:14px;">Your Nomadic team leader will show you around your setup, explain how everything works, and ensure you're comfortable before leaving you to enjoy your evening.</p>
    </div>
    <div style="margin-bottom:12px;">
      <strong style="color:#1B8F5A;">Enjoy Your Nomadic Desert BBQ Experience</strong>
      <p style="margin:4px 0 0 0;font-size:14px;">Light up the BBQ, relax under the desert sky, and enjoy dinner with your group as the sun sets and fire lanterns glow around you 🌅</p>
    </div>
    <div style="margin-bottom:12px;">
      <strong style="color:#1B8F5A;">Departure (Anytime up to Midnight)</strong>
      <p style="margin:4px 0 0 0;font-size:14px;">When you're ready to leave, please contact your Nomadic team leader at least 30–45 minutes before departure so they can assist with your transfer if needed.</p>
    </div>
    <div>
      <strong style="color:#1B8F5A;">🌿 Take All Trash With You</strong>
      <p style="margin:4px 0 0 0;font-size:14px;">Keep nature pristine <strong>#LeaveNoTrace</strong></p>
    </div>

    <h3 style="color:#3C2317;margin-top:20px;margin-bottom:10px;">Cancellation Policy</h3>
    <ul style="margin:0;padding-left:20px;">
      <li>All bookings are <strong>non-refundable</strong>.</li>
      <li>Free date changes up to <strong>72 hours</strong> before arrival (subject to availability).</li>
      <li>Changes after 72 hours: <strong>200 AED</strong> admin fee.</li>
    </ul>

    <h3 style="margin-top:20px;">Emergency Contacts</h3>
    <ul style="list-style:none;padding-left:0;margin:0;">
      <li>📞 <strong>Nomadic UAE:</strong> 0585271420</li>
      <li>🚨 <strong>Emergency Services:</strong> 112</li>
    </ul>
    <p style="margin-top:10px;">Please only contact in case of serious emergencies.</p>
  </div>`;

  const footer = `
  <div style="margin-top:40px;text-align:center;color:#8B6E58;font-size:13px;">
    <hr style="border:none;border-top:1px solid #EADAC1;margin-bottom:10px;">
    <p style="font-weight:600;font-size:14px;">Nomadic بدوي</p>
    <p>Commercial Manager – Badawi Leisure & Sport Equipment Rental</p>
    <p>License No: 979490</p>
    <p>📞 0585271420 | ✉️ <a href="mailto:yalla@nomadic.ae" style="color:#1B8F5A;text-decoration:none;">yalla@nomadic.ae</a></p>
    <p><a href="https://www.nomadic.ae" style="color:#1B8F5A;text-decoration:none;">www.nomadic.ae</a></p>
    <p>🏢 Empire Heights A, 9th Floor, Business Bay, Dubai</p>
  </div>`;

  return transporter.sendMail({
    from: `"Nomadic Barbecue" <${process.env.SMTP_USER}>`,
    to: booking.customerEmail,
    subject: "🔥 Your Desert Barbecue Setup is Confirmed!",
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;background-color:#FFF7E8;color:#3C2317;max-width:700px;margin:auto;border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#D2A679,#F6E4C1);padding:24px 20px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#3C2317;">Your Desert BBQ Experience Awaits 🔥</h1>
          <p style="margin:6px 0 0;color:#3C2317;">Booking Confirmation</p>
        </div>

        <div style="padding:24px;">
          <p>Dear <strong>${booking.customerName}</strong>,</p>
          <p>Thank you, your Nomadic Desert BBQ setup has been confirmed, we can’t wait for you and your group to have the Nomadic experience. Please find full details below of your booking.</p>

          <div style="margin:16px 0;border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">📅 <strong>Date</strong></td>
                <td style="padding:10px;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding:10px;">📍 <strong>Location</strong></td>
                <td style="padding:10px;">https://maps.app.goo.gl/pfbMXp9Vbeytt6N36</td>
              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">🕕 <strong>Arrival Time</strong></td>
                <td style="padding:10px;">6:00 PM</td>
              </tr>
              <tr>
                <td style="padding:10px;">👥 <strong>Group Size</strong></td>
                <td style="padding:10px;">${booking.groupSize} people</td>
              </tr>
            </table>
          </div>

          <h3 style="margin-top:20px;">Payment Summary</h3>
          <div style="border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:10px;">Subtotal</td><td style="padding:10px;text-align:right;">AED ${booking.subtotal.toFixed(
                2
              )}</td></tr>
              <tr style="background:#FDF7EC;"><td style="padding:10px;">VAT</td><td style="padding:10px;text-align:right;">AED ${booking.vat.toFixed(
                2
              )}</td></tr>
              <tr><td style="padding:10px;"><strong>Total</strong></td><td style="padding:10px;text-align:right;color:#1B8F5A;"><strong>AED ${booking.total.toFixed(
                2
              )}</strong></td></tr>
              <tr style="background:#FDF7EC;"><td style="padding:10px;">Status</td><td style="padding:10px;text-align:right;">${
                booking.isPaid ? "✅ Paid" : "❌ Pending"
              }</td></tr>
            </table>
          </div>

          ${infoSection}


          ${footer}
        </div>
      </div>
    `,
  });
}

export async function sendBarbecueAdminNotification(booking: any) {
  const bookingDate = formatDate(booking.bookingDate);
  const created = formatDate(booking.createdAt);

  const footer = `
  <div style="margin-top:40px;text-align:center;color:#8B6E58;font-size:13px;">
    <hr style="border:none;border-top:1px solid #EADAC1;margin-bottom:10px;">
    <p style="font-weight:600;font-size:14px;">Nomadic بدوي</p>
    <p>Commercial Manager – Badawi Leisure & Sport Equipment Rental</p>
    <p>License No: 979490</p>
    <p>📞 0585271420 | ✉️ <a href="mailto:yalla@nomadic.ae" style="color:#1B8F5A;text-decoration:none;">yalla@nomadic.ae</a></p>
    <p><a href="https://www.nomadic.ae" style="color:#1B8F5A;text-decoration:none;">www.nomadic.ae</a></p>
    <p>🏢 Empire Heights A, 9th Floor, Business Bay, Dubai</p>
  </div>`;

  return transporter.sendMail({
    from: `"Nomadic Notifications" <${process.env.SMTP_USER}>`,
    to: "bookings@nomadic.ae",
    subject: `🔥 New Barbecue Booking – ${booking.customerName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;background-color:#FFF7E8;color:#3C2317;max-width:700px;margin:auto;border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#D2A679,#F6E4C1);padding:24px 20px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#3C2317;">New Barbecue Booking Received</h1>
          <p style="margin:6px 0 0;color:#3C2317;">Admin Notification</p>
        </div>

        <div style="padding:24px;">
          <p><strong>${
            booking.customerName
          }</strong> has made a new barbecue booking.</p>

          <div style="margin:16px 0;border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">📅 <strong>Date</strong></td>
                <td style="padding:10px;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding:10px;">📍 <strong>Location</strong></td>
                <td style="padding:10px;"><a href="https://maps.app.goo.gl/pfbMXp9Vbeytt6N36" target="_blank">Al Qudra (40 min from Dubai)</a></td>
              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">🕕 <strong>Arrival Time</strong></td>
                <td style="padding:10px;">6:00 PM</td>
              </tr>
              <tr>
                <td style="padding:10px;">👥 <strong>Group Size</strong></td>
                <td style="padding:10px;">${booking.groupSize} people</td>
              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">📧 <strong>Email</strong></td>
                <td style="padding:10px;">${booking.customerEmail}</td>
              </tr>
              <tr>
                <td style="padding:10px;">📞 <strong>Phone</strong></td>
                <td style="padding:10px;">${booking.customerPhone}</td>
              </tr>
            </table>
          </div>

          <h3 style="margin-top:20px;">Payment Summary</h3>
          <div style="border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:10px;">Subtotal</td><td style="padding:10px;text-align:right;">AED ${booking.subtotal.toFixed(
                2
              )}</td></tr>
              <tr style="background:#FDF7EC;"><td style="padding:10px;">VAT</td><td style="padding:10px;text-align:right;">AED ${booking.vat.toFixed(
                2
              )}</td></tr>
              <tr><td style="padding:10px;"><strong>Total</strong></td><td style="padding:10px;text-align:right;color:#1B8F5A;"><strong>AED ${booking.total.toFixed(
                2
              )}</strong></td></tr>
              <tr style="background:#FDF7EC;"><td style="padding:10px;">Status</td><td style="padding:10px;text-align:right;">${
                booking.isPaid ? "✅ Paid" : "❌ Pending"
              }</td></tr>
            </table>
          </div>

          <div style="margin-top:24px;padding:16px;background:#FFF9F0;border:1px solid #EADAC1;border-radius:10px;">
            <p style="margin:0;font-size:13px;color:#8B6E58;">Booking created on: ${created}</p>
          </div>

          ${footer}
        </div>
      </div>
    `,
  });
}
