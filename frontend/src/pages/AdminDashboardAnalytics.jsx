import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { Link } from "react-router-dom";

const AdminDashboardAnalytics = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [regStats, setRegStats] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, eventRes, regRes, metricsRes] = await Promise.all([
        dashboardAPI.getAnalytics(),
        dashboardAPI.getEventStatistics(),
        dashboardAPI.getRegistrationStatistics(),
        dashboardAPI.getSystemMetrics(),
      ]);

      setAnalytics(analyticsRes.data.analytics);
      setEventStats(eventRes.data.statistics);
      setRegStats(regRes.data.statistics);
      setMetrics(metricsRes.data.metrics);
    } catch (error) {
      addToast("Failed to fetch analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="advanced-page">
      <div className="max-w-7xl mx-auto">
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to="/admin" className="text-blue-500 dark:text-blue-400">
            ← Back to Admin
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Dashboard Analytics
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics?.summary?.totalUsers || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Total Events
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics?.summary?.totalEvents || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Total Registrations
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics?.summary?.totalRegistrations || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Total Attendances
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics?.summary?.totalAttendances || 0}
            </p>
          </div>
        </div>

        {/* This Month Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              This Month
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Registrations
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics?.thisMonth?.registrations || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics?.thisMonth?.events || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Registration Growth
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics?.thisMonth?.registrationGrowth}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              System Metrics
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Avg Registrations/Event
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics?.eventMetrics?.avgRegistrations?.toFixed(1) || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Attendance Rate
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics?.registrationMetrics?.attendanceRate}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Total Attended
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics?.registrationMetrics?.attended || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Upcoming Events (Next 7 Days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    Event Name
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    Registrations
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    Capacity
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics?.upcomingEvents?.map((event) => (
                  <tr
                    key={event._id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {event.name}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {event.registeredCount}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {event.capacity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Registrations
          </h2>
          <div className="space-y-2">
            {analytics?.recentRegistrations?.map((reg) => (
              <div
                key={reg._id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {reg.userId?.fullName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reg.eventId?.name}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(reg.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardAnalytics;
