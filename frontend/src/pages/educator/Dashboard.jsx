import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { dummyDashboardData, assets } from "../../assets/assets";
import Loading from "../../components/student/Loading";

const Dashboard = () => {
  const { currency } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    setDashboardData(dummyDashboardData);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);


  return dashboardData ? (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8">
      {/* ======== STATS CARDS ======== */}
      <div className="flex flex-wrap gap-5 items-center">
        {/* Total Enrolments */}
        <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md">
          <img src={assets.patients_icon} alt="students" className="w-10 h-10" />
          <div>
            <p className="text-2xl font-semibold text-gray-700">
              {dashboardData.enrolledStudentsData?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Total Enrolments</p>
          </div>
        </div>

        {/* Total Courses */}
        <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md">
          <img src={assets.appointments_icon} alt="courses" className="w-10 h-10" />
          <div>
            <p className="text-2xl font-semibold text-gray-700">
              {dashboardData.totalCourses || 0}
            </p>
            <p className="text-sm text-gray-500">Total Courses</p>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md">
          <img src={assets.earning_icon} alt="earnings" className="w-10 h-10" />
          <div>
            <p className="text-2xl font-semibold text-gray-700">
              {currency}
              {dashboardData.totalEarnings || 0}
            </p>
            <p className="text-sm text-gray-500">Total Earnings</p>
          </div>
        </div>
      </div>

      {/* ======== LATEST ENROLMENTS TABLE ======== */}
      <div>
        <h2 className="pb-4 text-lg font-medium">Latest Enrolments</h2>
        <div className="overflow-x-auto rounded-md border border-gray-300 bg-white shadow-sm max-w-4xl">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell w-12">#</th>
                <th className="px-4 py-3 font-semibold text-left">Student Name</th>
                <th className="px-4 py-3 font-semibold text-left">Course Title</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600">
              {dashboardData.enrolledStudentsData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{index + 1}</td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img
                      src={item.student.imageUrl}
                      alt="profile"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="truncate">{item.student.name}</span>
                  </td>
                  <td className="px-4 py-3 truncate">{item.courseTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : < Loading />
};

export default Dashboard;
