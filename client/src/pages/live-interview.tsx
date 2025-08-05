import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import LiveInterviewHub from "@/components/LiveInterviewHub";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function LiveInterviewPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // Get current candidate based on interview time
  const { data: currentInterviewData, isLoading, refetch } = useQuery({
    queryKey: ["/api/interviews/current", refreshKey],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/interviews/current");
      if (response.status === 404) {
        return null;
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds to check for time changes
  });

  // Auto-refresh every minute to update current candidate
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const currentCandidate = currentInterviewData?.candidate;
  const timeStatus = currentInterviewData?.timeStatus;

  // ✨ Handler function to open the resume link
  const handleViewResume = () => {
    if (currentCandidate?.["Resume Link"]) {
      // Opens the link in a new tab with security best practices
      window.open(currentCandidate["Resume Link"], '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No Resume",
        description: "A resume link is not available for this candidate.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Interview data has been refreshed",
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Interview Data...</h2>
              <p className="text-gray-600">Checking for current and upcoming interviews.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCandidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Interview Scheduled</h2>
              <p className="text-gray-600">There are no candidates scheduled for interviews at this time.</p>
              <Button onClick={handleRefresh} className="mt-4">
                Refresh
              </Button>
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
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Interview Hub</h1>
              <p className="text-gray-600">
                {timeStatus === 'ongoing' ? 'Interview currently in progress' : 'Next scheduled interview'}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {timeStatus === 'ongoing' ? '🔴 Live' : '⏰ Upcoming'}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {currentCandidate.interviewDate} at {currentCandidate.interviewTime}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleViewResume}
                disabled={!currentCandidate?.["Resume Link"]}
              >
                View Full Resume
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Current Candidate Info */}
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentCandidate["Candidate Name"]}</h2>
                <p className="text-gray-600">{currentCandidate["Job Title"]}</p>
                <p className="text-sm text-gray-500">{currentCandidate.Email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Interview Time</p>
                <p className="text-sm text-gray-500">{currentCandidate.interviewDate}</p>
                <p className="text-sm text-gray-500">{currentCandidate.interviewTime}</p>
                {currentCandidate["Google Meet Id"] && (
                  <a 
                    href={`https://${currentCandidate["Google Meet Id"]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* LiveInterviewHub Component */}
          <LiveInterviewHub candidate={currentCandidate} />
        </div>
      </div>
    </div>
  );
}