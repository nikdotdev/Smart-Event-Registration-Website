import cron from "node-cron";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendReminderEmail } from "./emailUtil.js";

export const scheduleEventReminders = () => {
  // Run every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("Running event reminder task...");
    try {
      // Get events that are happening in 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const upcomingEvents = await Event.find({
        date: {
          $gte: tomorrow.setHours(0, 0, 0, 0),
          $lte: tomorrowEnd,
        },
        status: "upcoming",
      });

      for (const event of upcomingEvents) {
        // Get all registrations for this event
        const registrations = await Registration.find({
          eventId: event._id,
          status: "registered",
        }).populate("userId");

        for (const registration of registrations) {
          const user = registration.userId;
          await sendReminderEmail(
            user.email,
            user.fullName,
            event.name,
            event.date
          );
        }

        console.log(`Sent reminders for event: ${event.name}`);
      }
    } catch (error) {
      console.error("Error in event reminder task:", error);
    }
  });

  console.log("Event reminder scheduler initialized");
};

export const scheduleEventStatusUpdate = () => {
  // Run every hour to update event status
  cron.schedule("0 * * * *", async () => {
    console.log("Running event status update task...");
    try {
      const now = new Date();

      // Mark ongoing events
      await Event.updateMany(
        {
          date: { $lte: now },
          status: "upcoming",
        },
        { status: "ongoing" }
      );

      // Mark completed events
      const completedDate = new Date();
      completedDate.setHours(completedDate.getHours() - 2); // Assuming events are 2 hours long

      await Event.updateMany(
        {
          date: { $lte: completedDate },
          status: "ongoing",
        },
        { status: "completed" }
      );

      console.log("Event status updated successfully");
    } catch (error) {
      console.error("Error in event status update task:", error);
    }
  });

  console.log("Event status update scheduler initialized");
};
