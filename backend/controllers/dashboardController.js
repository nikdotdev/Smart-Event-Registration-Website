import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Attendance from "../models/Attendance.js";

export const getDashboardAnalytics = async (req, res) => {
  try {
    // Get all relevant counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const totalAttendances = await Attendance.countDocuments();

    // Get upcoming events (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingEvents = await Event.find({
      date: {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      },
    }).sort({ date: 1 });

    // Get this month's registrations
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthEnd = new Date();
    thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
    thisMonthEnd.setDate(0);
    thisMonthEnd.setHours(23, 59, 59, 999);

    const thisMonthRegistrations = await Registration.countDocuments({
      createdAt: {
        $gte: thisMonthStart,
        $lte: thisMonthEnd,
      },
    });

    // Get this month's events
    const thisMonthEvents = await Event.countDocuments({
      createdAt: {
        $gte: thisMonthStart,
        $lte: thisMonthEnd,
      },
    });

    // Get top events by registrations
    const topEvents = await Event.find()
      .sort({ registeredCount: -1 })
      .limit(5)
      .populate("createdBy", "fullName email");

    // Get recent registrations
    const recentRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "fullName email")
      .populate("eventId", "name");

    // Calculate growth metrics
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

    const lastMonthRegistrations = await Registration.countDocuments({
      createdAt: {
        $gte: lastMonthStart,
        $lte: lastMonthEnd,
      },
    });

    const registrationGrowth =
      lastMonthRegistrations > 0
        ? (
            ((thisMonthRegistrations - lastMonthRegistrations) /
              lastMonthRegistrations) *
            100
          ).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalUsers,
          totalEvents,
          totalRegistrations,
          totalAttendances,
        },
        thisMonth: {
          registrations: thisMonthRegistrations,
          events: thisMonthEvents,
          registrationGrowth: `${registrationGrowth}%`,
        },
        upcomingEvents: upcomingEvents.map((event) => ({
          _id: event._id,
          name: event.name,
          date: event.date,
          registeredCount: event.registeredCount,
          capacity: event.capacity,
        })),
        topEvents,
        recentRegistrations,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventStatistics = async (req, res) => {
  try {
    // Events by status
    const eventsByStatus = await Event.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Events by category
    const eventsByCategory = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Total capacity vs registrations
    const capacityStats = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: "$capacity" },
          totalRegistrations: { $sum: "$registeredCount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        eventsByStatus,
        eventsByCategory,
        capacityStats: capacityStats[0] || {
          totalCapacity: 0,
          totalRegistrations: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRegistrationStatistics = async (req, res) => {
  try {
    // Registrations by status
    const registrationsByStatus = await Registration.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Registrations by attendance status
    const registrationsByAttendance = await Registration.aggregate([
      {
        $group: {
          _id: "$attendanceStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Registrations by month (last 12 months)
    const registrationsByMonth = await Registration.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        registrationsByStatus,
        registrationsByAttendance,
        registrationsByMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemMetrics = async (req, res) => {
  try {
    // Calculate average registrations per event
    const eventStats = await Event.aggregate([
      {
        $group: {
          _id: null,
          avgRegistrations: { $avg: "$registeredCount" },
          maxRegistrations: { $max: "$registeredCount" },
          minRegistrations: { $min: "$registeredCount" },
        },
      },
    ]);

    // Calculate attendance rate
    const registrationStats = await Registration.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          attended: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "attended"] }, 1, 0],
            },
          },
          noShow: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "no-show"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const attendanceRate =
      registrationStats[0].total > 0
        ? (
            (registrationStats[0].attended / registrationStats[0].total) *
            100
          ).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      metrics: {
        eventMetrics: eventStats[0] || {
          avgRegistrations: 0,
          maxRegistrations: 0,
          minRegistrations: 0,
        },
        registrationMetrics: {
          total: registrationStats[0]?.total || 0,
          attended: registrationStats[0]?.attended || 0,
          noShow: registrationStats[0]?.noShow || 0,
          attendanceRate: `${attendanceRate}%`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
