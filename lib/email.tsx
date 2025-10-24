import nodemailer from "nodemailer"

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function formatAddOns(addOns) {
  if (!addOns || Object.keys(addOns).length === 0) return `<em style="color:#8B6E58;">No standard add-ons selected</em>`

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
      return `<li>${label}</li>`
    })
    .join("")

  return `<ul style="margin:0; padding-left:18px; color:#3C2317;">${list}</ul>`
}

function formatSleeping(arrangements) {
  if (!arrangements?.length) return "<em style='color:#8B6E58;'>No sleeping arrangements specified</em>"

  const filtered = arrangements.filter((a) => a.arrangement !== "custom")
  if (!filtered.length) return "<em style='color:#8B6E58;'>No sleeping arrangements specified</em>"

  const rows = filtered
    .map(
      (a) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #EADAC1;">Tent ${a.tentNumber}</td>
          <td style="padding:10px;border-bottom:1px solid #EADAC1;">${
            a.arrangement === "all-singles"
              ? "All Single Beds (4 singles)"
              : a.arrangement === "two-doubles"
                ? "Two Double Beds (2 doubles)"
                : a.arrangement === "mix"
                  ? "Mixed (1 double + 2 singles)"
                  : a.arrangement === "double-bed"
                    ? "Double Bed (1 double)"
                    : a.arrangement
          }</td>
        </tr>`,
    )
    .join("")

  return `
    <div style="overflow:hidden;border-radius:10px;border:1px solid #EADAC1;margin-top:8px;">
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="background:linear-gradient(90deg,#E5C79E,#F7E8C9);text-align:left;">
            <th style="padding:10px;">Tent #</th>
            <th style="padding:10px;">Arrangement</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

function formatDate(value) {
  const dateValue = value?.$date || value
  if (!dateValue) return "Not specified"
  const date = new Date(dateValue)
  return isNaN(date)
    ? "Invalid date"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
}

export async function sendBookingConfirmation(booking) {
  const bookingDate = formatDate(booking.bookingDate)

  const infoSection = `
  <div style="margin-top:25px;background:#FFF9F0;border:1px solid #EADAC1;border-radius:10px;padding:20px;color:#3C2317;line-height:1.6;font-size:15px;">
    <h3 style="color:#3C2317;margin-bottom:10px;">Before You Arrive</h3>
    <p>Everything will be set up and ready for you upon arrival — all you need to bring is your BBQ food and drinks. For a detailed breakdown of what's included, you can <a href="https://nomadic.ae" style="color:#1B8F5A;text-decoration:none;">click here</a>.</p>

    <h3 style="margin-top:20px;">Check-In Information</h3>
    <p style="margin-bottom:15px;">
  It is important that you arrive at <strong>${booking.arrivalTime}</strong> so our team can guide you to your camp. 
  Nomadic camping sites can sometimes be difficult to access by saloon car.
</p>

<p>
  If you don't have a 4x4, you can park near the meeting spot, and our team will transport you and your belongings to camp. 
  4x4 vehicles will have no issue reaching the site.
</p>

    <p>Please bring warm jumpers for the evening as desert nights can get chilly — though the campfire will keep you cozy 🔥</p>

    <h3 style="margin-top:20px;">No-Show Policy</h3>
    <p>If you do not arrive within <strong>1 hour</strong> of the assigned check-in time, your booking will be cancelled. If you are running late, please contact your camp setup leader (they will reach out to you on the morning of your booking).</p>

    <h3 style="margin-top:20px;">Check-Out Information</h3>
    <p>When you're ready to leave, please message Nomadic via <a href="https://wa.me/971585271420" style="color:#1B8F5A;text-decoration:none;">WhatsApp</a> or Instagram. Kindly provide at least <strong>90 minutes' notice</strong> so our team can reach you in good time.</p>

    <h3 style="margin-top:20px;">Environmental Responsibility 🌿</h3>
    <p>Upon leaving camp, please take all your rubbish with you using the bags provided. Failure to do so will incur an additional <strong>200 AED</strong> cleaning charge. We deeply value preserving the UAE's stunning landscapes — <strong>#LeaveNoTrace</strong>.</p>

    <h3 style="margin-top:20px;">Emergency Contacts</h3>
    <ul style="list-style:none;padding-left:0;margin:0;">
      <li>📞 <strong>Nomadic UAE:</strong> 0585271420</li>
      <li>🚨 <strong>Emergency Services:</strong> 112</li>
    </ul>

    <p style="margin-top:20px;">Please only contact in case of serious emergencies.</p>
  </div>`

  const footer = `
  <div style="margin-top:40px;text-align:center;color:#8B6E58;font-size:13px;">
    <hr style="border:none;border-top:1px solid #EADAC1;margin-bottom:10px;">
    <p style="font-weight:600;font-size:14px;">Nomadic بدوي</p>
    <p>Commercial Manager – Badawi Leisure & Sport Equipment Rental</p>
    <p>License No: 979490</p>
    <p>📞 0585271420 | ✉️ <a href="mailto:yalla@nomadic.ae" style="color:#1B8F5A;text-decoration:none;">yalla@nomadic.ae</a></p>
    <p><a href="https://www.nomadic.ae" style="color:#1B8F5A;text-decoration:none;">www.nomadic.ae</a></p>
    <p>🏢 Empire Heights A, 9th Floor, Business Bay, Dubai</p>
  </div>`

  return transporter.sendMail({
    from: `"Nomadic Bookings" <${process.env.SMTP_USER}>`,
    to: booking.customerEmail,
    subject: "🌵 Your Nomadic Camping Booking is Confirmed!",
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;background-color:#FFF7E8;color:#3C2317;max-width:700px;margin:auto;border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#D2A679,#F6E4C1);padding:24px 20px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#3C2317;">Your Nomadic Adventure Awaits 🌵</h1>
          <p style="margin:6px 0 0;color:#3C2317;">Booking Confirmation</p>
        </div>

        <div style="padding:24px;">
          <p>Dear <strong>${booking.customerName}</strong>,</p>
          <p>Thank you, your Nomadic camping setup has been confirmed, we can't wait for you and your group to have the Nomadic experience.Please find full details below of your booking.</p>

          <div style="margin:16px 0;border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">📅 <strong>Date</strong></td>
                <td style="padding:10px;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding:10px;">📍 <strong>Location</strong></td>
                <td style="padding:10px;">
  ${
    booking.location === "Desert"
      ? `<a href="https://maps.app.goo.gl/pfbMXp9Vbeytt6N36" target="_blank">Desert</a>`
      : `<a href="https://maps.app.goo.gl/pfbMXp9Vbeytt6N36" target="_blank">Wadi</a>`
  }
</td>

              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">🕓 <strong>Arrival Time</strong></td>
                <td style="padding:10px;">${booking.arrivalTime}</td>
              </tr>
              <tr>
                <td style="padding:10px;">👨‍👩‍👧 <strong>Guests</strong></td>
                <td style="padding:10px;">${booking.adults} adults${
                  booking.children ? `, ${booking.children} children` : ""
                }</td>
              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">⛺ <strong>Tents</strong></td>
                <td style="padding:10px;">${booking.numberOfTents}</td>
              </tr>
            </table>
          </div>

          <h3>Sleeping Arrangements</h3>
          ${formatSleeping(booking.sleepingArrangements)}

          <h3 style="margin-top:20px;">Add-ons</h3>
          ${formatAddOns(booking.addOns)}

          ${
            booking.specialPricingName && booking.specialPricingAmount > 0
              ? `
          <h3 style="margin-top:20px;">🎉 Special Pricing Applied</h3>
          <div style="border:1px solid #EADAC1;border-radius:10px;overflow:hidden;background:#FEF3C7;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="background:#FDE68A;">
                <td style="padding:10px;"><strong>Pricing Period</strong></td>
                <td style="padding:10px;text-align:right;"><strong>${booking.specialPricingName}</strong></td>
              </tr>
              <tr>
                <td style="padding:10px;">Special Pricing Amount</td>
                <td style="padding:10px;text-align:right;color:#D97706;"><strong>AED ${booking.specialPricingAmount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          `
              : ""
          }

          <h3 style="margin-top:20px;">Payment Summary</h3>
          <div style="border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:10px;">Subtotal</td><td style="padding:10px;text-align:right;">AED ${booking.subtotal.toFixed(
                2,
              )}</td></tr>
              ${
                booking.specialPricingAmount > 0
                  ? `<tr style="background:#FDF7EC;"><td style="padding:10px;">${booking.specialPricingName || "Special Pricing"}</td><td style="padding:10px;text-align:right;color:#D97706;"><strong>AED ${booking.specialPricingAmount.toFixed(2)}</strong></td></tr>`
                  : ""
              }
              <tr style="background:#FDF7EC;"><td style="padding:10px;">VAT</td><td style="padding:10px;text-align:right;">AED ${booking.vat.toFixed(
                2,
              )}</td></tr>
              <tr><td style="padding:10px;"><strong>Total</strong></td><td style="padding:10px;text-align:right;color:#1B8F5A;"><strong>AED ${booking.total.toFixed(
                2,
              )}</strong></td></tr>
              <tr style="background:#FDF7EC;"><td style="padding:10px;">Status</td><td style="padding:10px;text-align:right;">${
                booking.isPaid ? "✅ Paid" : "❌ Pending"
              }</td></tr>
            </table>
          </div>

          ${infoSection}

          <div style="text-align:center;margin-top:24px;">
            <a href="https://nomadic.ae" style="display:inline-block;background:linear-gradient(90deg,#1B8F5A,#2BC480);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Your Booking</a>
          </div>

          ${footer}
        </div>
      </div>
    `,
  })
}

export async function sendAdminNotification(booking) {
  const bookingDate = formatDate(booking.bookingDate)
  const created = formatDate(booking.createdAt)

  const footer = `
  <div style="margin-top:40px;text-align:center;color:#8B6E58;font-size:13px;">
    <hr style="border:none;border-top:1px solid #EADAC1;margin-bottom:10px;">
    <p style="font-weight:600;font-size:14px;">Nomadic بدوي</p>
    <p>Commercial Manager – Badawi Leisure & Sport Equipment Rental</p>
    <p>License No: 979490</p>
    <p>📞 0585271420 | ✉️ <a href="mailto:yalla@nomadic.ae" style="color:#1B8F5A;text-decoration:none;">yalla@nomadic.ae</a></p>
    <p><a href="https://www.nomadic.ae" style="color:#1B8F5A;text-decoration:none;">www.nomadic.ae</a></p>
    <p>🏢 Empire Heights A, 9th Floor, Business Bay, Dubai</p>
  </div>`

  return transporter.sendMail({
    from: `"Nomadic Notifications" <${process.env.SMTP_USER}>`,
    to: "umarahmedse@gmail.com",
    subject: `📩 New Booking – ${booking.customerName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;background-color:#FFF7E8;color:#3C2317;max-width:700px;margin:auto;border-radius:16px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#D2A679,#F6E4C1);padding:24px 20px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#3C2317;">New Booking Received</h1>
          <p style="margin:6px 0 0;color:#3C2317;">Admin Notification</p>
        </div>

        <div style="padding:24px;">
          <p><strong>${booking.customerName}</strong> has made a new booking.</p>

          <div style="margin:16px 0;border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">📅 <strong>Date</strong></td>
                <td style="padding:10px;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding:10px;">📍 <strong>Location</strong></td>
                <td style="padding:10px;">
  ${
    booking.location === "Desert"
      ? `<a href="https://maps.app.goo.gl/pfbMXp9Vbeytt6N36" target="_blank">Desert</a>`
      : `<a href="https://maps.app.goo.gl/pfbMXp9Vbeytt6N36" target="_blank">Wadi</a>`
  }
</td>

              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">👨‍👩‍👧 <strong>Guests</strong></td>
                <td style="padding:10px;">${booking.adults} adults${
                  booking.children ? `, ${booking.children} children` : ""
                }</td>
              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">👨‍👩⌚ <strong>Arrival Time</strong></td>
                <td style="padding:10px;">${booking.arrivalTime}</td>
              </tr>
              <tr>
                <td style="padding:10px;">📧 <strong>Email</strong></td>
                <td style="padding:10px;">${booking.customerEmail}</td>
              </tr>
              <tr style="background:#FDF7EC;">
                <td style="padding:10px;">📞 <strong>Phone</strong></td>
                <td style="padding:10px;">${booking.customerPhone}</td>
              </tr>
            </table>
          </div>

          <h3>Sleeping Arrangements</h3>
          ${formatSleeping(booking.sleepingArrangements)}

          <h3 style="margin-top:20px;">Add-ons</h3>
          ${formatAddOns(booking.addOns)}

          ${
            booking.specialPricingName && booking.specialPricingAmount > 0
              ? `
          <h3 style="margin-top:20px;">🎉 Special Pricing Applied</h3>
          <div style="border:1px solid #EADAC1;border-radius:10px;overflow:hidden;background:#FEF3C7;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="background:#FDE68A;">
                <td style="padding:10px;"><strong>Pricing Period</strong></td>
                <td style="padding:10px;text-align:right;"><strong>${booking.specialPricingName}</strong></td>
              </tr>
              <tr>
                <td style="padding:10px;">Special Pricing Amount</td>
                <td style="padding:10px;text-align:right;color:#D97706;"><strong>AED ${booking.specialPricingAmount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          `
              : ""
          }

          <h3 style="margin-top:20px;">Payment Summary</h3>
          <div style="border:1px solid #EADAC1;border-radius:10px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:10px;">Subtotal</td><td style="padding:10px;text-align:right;">AED ${booking.subtotal.toFixed(
                2,
              )}</td></tr>
              ${
                booking.specialPricingAmount > 0
                  ? `<tr style="background:#FDF7EC;"><td style="padding:10px;">${booking.specialPricingName || "Special Pricing"}</td><td style="padding:10px;text-align:right;color:#D97706;"><strong>AED ${booking.specialPricingAmount.toFixed(2)}</strong></td></tr>`
                  : ""
              }
              <tr style="background:#FDF7EC;"><td style="padding:10px;">VAT</td><td style="padding:10px;text-align:right;">AED ${booking.vat.toFixed(
                2,
              )}</td></tr>
              <tr><td style="padding:10px;"><strong>Total</strong></td><td style="padding:10px;text-align:right;color:#1B8F5A;"><strong>AED ${booking.total.toFixed(
                2,
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
  })
}
