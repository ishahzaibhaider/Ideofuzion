import { Link } from "wouter"; // Corrected import
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import MetricCard from "@/components/DashboardWidgets/MetricCard";
import HiringFunnel from "@/components/DashboardWidgets/HiringFunnel";
import UpcomingInterviews from "@/components/DashboardWidgets/UpcomingInterviews";
import AddUnavailableSlotsDialog from "@/components/AddUnavailableSlotsDialog";
import AddBusySlotsDialog from "@/components/AddBusySlotsDialog";
import BusySlotsDisplay from "@/components/DashboardWidgets/BusySlotsDisplay";
import UnavailableSlotsManager from "@/components/UnavailableSlotsManager";
import ExtendMeetingDialog from "@/components/ExtendMeetingDialog";
import { Users, Video, BarChart3, Clock, Plus, TrendingUp, Calendar, Star } from "lucide-react";

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const response = await authenticatedApiRequest(
        "GET",
        "/api/dashboard/metrics"
      );
      return response.json();
    },
  });

  if (isLoading) {
    // The loading state remains the same...
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Modern Header with Glass Effect */}
          <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                    Hiring Dashboard
                  </h1>
                  <p className="text-gray-600 font-medium">
                    Monitor your recruitment pipeline and key metrics
                  </p>
                </div>
              </div>
              {/* Modern Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                <ExtendMeetingDialog />
                <AddUnavailableSlotsDialog />
                <AddBusySlotsDialog />
                <Link href="/create-jobs" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Plus className="w-5 h-5" />
                  <span>Create New Job</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Modern Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8" />
                <TrendingUp className="w-5 h-5 opacity-70" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium opacity-90">Total Candidates</h3>
                <p className="text-3xl font-bold">{metrics?.totalCandidates || 0}</p>
                <p className="text-sm opacity-75">+12% from last month</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8" />
                <Star className="w-5 h-5 opacity-70" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium opacity-90">Hiring Rate</h3>
                <p className="text-3xl font-bold">{metrics?.hireRate || 0}%</p>
                <p className="text-sm opacity-75">+5% improvement</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8" />
                <Calendar className="w-5 h-5 opacity-70" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium opacity-90">Avg. Time to Hire</h3>
                <p className="text-3xl font-bold">{metrics?.avgTimeToHire || "0d"}</p>
                <p className="text-sm opacity-75">2d faster than avg</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Video className="w-8 h-8" />
                <TrendingUp className="w-5 h-5 opacity-70" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium opacity-90">Interviews Today</h3>
                <p className="text-3xl font-bold">{metrics?.upcomingInterviews?.length || 0}</p>
                <p className="text-sm opacity-75">Well scheduled</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1">
              <HiringFunnel stages={metrics?.funnelStages || []} />
            </div>
            <div className="xl:col-span-1">
              <UpcomingInterviews interviews={metrics?.upcomingInterviews || []} />
            </div>
            <div className="xl:col-span-1 space-y-6">
              <BusySlotsDisplay />
              <UnavailableSlotsManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
