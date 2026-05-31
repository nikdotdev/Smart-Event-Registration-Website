import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { participantsAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { FiDownload, FiTrash2, FiFileText } from "react-icons/fi";

const ParticipantsManagementPage = () => {
  const { addToast } = useToast();
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchParticipants();
  }, [page, search]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await participantsAPI.getParticipants(eventId, {
        search,
        page,
        limit: 10,
      });
      setParticipants(response.data.participants);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      addToast("Failed to fetch participants", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (registrationId) => {
    if (!window.confirm("Are you sure you want to remove this participant?"))
      return;

    try {
      await participantsAPI.deleteParticipant(registrationId, eventId);
      addToast("Participant removed successfully", "success");
      fetchParticipants();
    } catch (error) {
      addToast("Failed to remove participant", "error");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await participantsAPI.exportCSV(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `participants-${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      addToast("CSV exported successfully", "success");
    } catch (error) {
      addToast("Failed to export CSV", "error");
    }
  };

  const handleGenerateEventReport = async () => {
    try {
      const response = await participantsAPI.generateEventReport(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `event-report-${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      addToast("Event report generated successfully", "success");
    } catch (error) {
      addToast("Failed to generate report", "error");
    }
  };

  const handleGenerateParticipantReport = async () => {
    try {
      const response = await participantsAPI.generateParticipantReport(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `participants-report-${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      addToast("Participant report generated successfully", "success");
    } catch (error) {
      addToast("Failed to generate report", "error");
    }
  };

  return (
    <div className="advanced-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Participants Management
        </h1>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search participants by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <FiDownload /> Export CSV
              </button>
              <button
                onClick={handleGenerateEventReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <FiFileText /> Event Report
              </button>
              <button
                onClick={handleGenerateParticipantReport}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <FiFileText /> Participant Report
              </button>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        {loading ? (
          <div className="text-center py-10">Loading participants...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Registration #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr
                    key={participant._id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {participant.userId?.fullName}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {participant.userId?.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {participant.registrationNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          participant.status === "registered"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {participant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          participant.attendanceStatus === "attended"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : participant.attendanceStatus === "no-show"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {participant.attendanceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(participant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteParticipant(participant._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove participant"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
  );
};

export default ParticipantsManagementPage;
