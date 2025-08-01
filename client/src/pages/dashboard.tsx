import { Link } from "wouter"; // Corrected import
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import MetricCard from "@/components/DashboardWidgets/MetricCard";
import HiringFunnel from "@/components/DashboardWidgets/HiringFunnel";
import UpcomingInterviews from "@/components/DashboardWidgets/UpcomingInterviews";
import AddAvailableSlotsDialog from "@/components/AddAvailableSlotsDialog";
import { Users, Video, BarChart3, Clock, Plus } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hiring Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor your recruitment pipeline and key metrics
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <AddAvailableSlotsDialog />
              <Link href="/create-jobs" className="bg-primary text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-primary/90 transition-colors">
                <Plus className="w-5 h-5" />
                <span>Create Job</span>
              </Link>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Candidates"
              value={metrics?.totalCandidates || 0}
              change="+12%"
              trend="up"
              icon={<Users className="w-6 h-6 text-primary" />}
            />
           
            <MetricCard
              title="Hiring Rate"
              value={`${metrics?.hireRate || 0}%`}
              change="+5%"
              trend="up"
              icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
            />
            <MetricCard
              title="Avg. Time to Hire"
              value={metrics?.avgTimeToHire || "0d"}
              change="-2d"
              trend="down"
              icon={<Clock className="w-6 h-6 text-orange-600" />}
              changeType="positive"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <HiringFunnel stages={metrics?.funnelStages || []} />
            <UpcomingInterviews interviews={metrics?.upcomingInterviews || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
