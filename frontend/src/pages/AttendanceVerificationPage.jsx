import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { attendanceAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const AttendanceVerificationPage = () => {
  const { addToast } = useToast();
  const { eventId } = useParams();
  const [qrCode, setQrCode] = useState("");
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAttendanceReport();
    fetchAttendances();
  }, [page]);

  const fetchAttendanceReport = async () => {
    try {
      const response = await attendanceAPI.getAttendanceReport(eventId);
      setSummary(response.data.summary);
    } catch (error) {
      addToast("Failed to fetch attendance report", "error");
    }
  };

  const fetchAttendances = async () => {
    try {
      const response = await attendanceAPI.getEventAttendance(eventId, {
        page,
        limit: 10,
      });
      setCheckedInUsers(response.data.attendances);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      addToast("Failed to fetch attendances", "error");
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      addToast("Please scan or enter a QR code", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await attendanceAPI.checkIn({
        qrCode: qrCode.trim(),
        eventId,
      });
      addToast(`Check-in successful: ${response.data.user.name}`, "success");
      setQrCode("");
      fetchAttendances();
      fetchAttendanceReport();
    } catch (error) {
      addToast(error.response?.data?.message || "Check-in failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advanced-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Attendance Verification
        </h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Total Check-ins
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {summary?.totalAttendances || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Checked In
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
              {summary?.checkedIn || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Avg Stay Time
            </h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {summary?.averageStayTime || 0} min
            </p>
          </div>
        </div>

        {/* QR Code Scanner */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Scan QR Code
          </h2>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                QR Code / Ticket Number
              </label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Scan QR code here or enter manually"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Check In"}
            </button>
          </form>
        </div>

        {/* Checked In Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Checked In Users
          </h2>
          <div className="space-y-2">
            {checkedInUsers.map((attendance) => (
              <div
                key={attendance._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {attendance.userId?.fullName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {attendance.userId?.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(attendance.checkInTime).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {attendance.status === "checked-out" && "Checked out"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-900 dark:text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceVerificationPage;
