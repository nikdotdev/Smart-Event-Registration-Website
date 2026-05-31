import transporter from "../config/email.js";

export const sendRegistrationEmail = async (userEmail, event) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Event Confirmation: ${event.name}`,
      html: `
        <h2>Event Registration Confirmation</h2>
        <p>Thank you for registering for our event!</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>${event.name}</h3>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Description:</strong> ${event.description}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>Event Planner Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

export const sendCancellationEmail = async (userEmail, event) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Event Cancellation: ${event.name}`,
      html: `
        <h2>Event Registration Cancelled</h2>
        <p>Your registration for the following event has been cancelled:</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>${event.name}</h3>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        </div>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Event Planner Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error.message);
    throw error;
  }
};
