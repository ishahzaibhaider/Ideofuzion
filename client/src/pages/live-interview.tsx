import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import LiveInterviewHub from "@/components/LiveInterviewHub";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Clock } from "lucide-react";
import type { Candidate } from "@shared/schema";

export default function LiveInterviewPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualSelection, setManualSelection] = useState(false);
  const { toast } = useToast();

  // Get all candidates for dropdown
  const { data: allCandidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/candidates");
      return response.json() as Promise<Candidate[]>;
    },
    refetchInterval: 30000,
  });

  // Get current candidate based on interview time (only when no manual selection)
  const { data: currentInterviewData, isLoading: isLoadingCurrent, refetch } = useQuery({
    queryKey: ["/api/interviews/current", refreshKey],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/interviews/current");
      if (response.status === 404) {
        return null;
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: !manualSelection, // Only fetch current interview when no manual selection
  });

  // Get specific candidate data when manually selected
  const { data: selectedCandidateData, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["/api/candidates", selectedCandidateId],
    queryFn: async () => {
      if (!selectedCandidateId || !allCandidates) return null;
      return allCandidates.find(c => c.id === selectedCandidateId) || null;
    },
    enabled: !!selectedCandidateId && !!allCandidates,
  });

  // Filter candidates for search and dropdown
  const filteredCandidates = allCandidates?.filter(candidate =>
    candidate["Candidate Name"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate["Job Title"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.Email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Determine which candidate to display
  const displayCandidate = manualSelection && selectedCandidateData 
    ? selectedCandidateData 
    : currentInterviewData?.candidate;
  const timeStatus = manualSelection ? 'manual' : currentInterviewData?.timeStatus;

  // Handle candidate selection from dropdown
  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setManualSelection(true);
    const candidate = allCandidates?.find(c => c.id === candidateId);
    if (candidate) {
      toast({
        title: "Candidate Selected",
        description: `Now viewing ${candidate["Candidate Name"]}'s interview details`,
      });
    }
  };

  // Reset to current interview
  const handleResetToCurrent = () => {
    setManualSelection(false);
    setSelectedCandidateId(null);
    setSearchQuery("");
    refetch();
    toast({
      title: "Reset to Current",
      description: "Now showing current/upcoming interview",
    });
  };

  const isLoading = isLoadingCandidates || isLoadingCurrent || isLoadingSelected;

  // ✨ Handler function to open the resume link
  const handleViewResume = () => {
    if (displayCandidate?.["Resume Link"]) {
      // Opens the link in a new tab with security best practices
      window.open(displayCandidate["Resume Link"], '_blank', 'noopener,noreferrer');
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

  if (!displayCandidate && !manualSelection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Candidate Selection Section */}
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Select a Candidate for Interview
              </h2>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search candidates by name, job title, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-candidate-search"
                />
              </div>

              {/* Candidate Dropdown */}
              <Select onValueChange={handleCandidateSelect} data-testid="select-candidate">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a candidate from the list" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="font-medium">{candidate["Candidate Name"]}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {candidate["Job Title"]}
                            </span>
                          </div>
                          {candidate["Interview Start"] && (
                            <span className="text-xs text-gray-400">
                              {new Date(candidate["Interview Start"]).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-candidates" disabled>
                      No candidates found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Current Interview</h2>
              <p className="text-gray-600">There are no candidates scheduled for interviews at this time. Please select a candidate from the dropdown above to view their details.</p>
              <Button onClick={handleRefresh} className="mt-4" data-testid="button-refresh">
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
          {/* Candidate Selection Section */}
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Select Interview Candidate
              </h2>
              {manualSelection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToCurrent}
                  className="flex items-center"
                  data-testid="button-reset-current"
                >
                  <Clock className="mr-1 h-4 w-4" />
                  Current Interview
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search candidates by name, job title, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-candidate-search"
                />
              </div>

              {/* Candidate Dropdown */}
              <Select onValueChange={handleCandidateSelect} data-testid="select-candidate">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a candidate from the list" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="font-medium">{candidate["Candidate Name"]}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {candidate["Job Title"]}
                            </span>
                          </div>
                          {candidate["Interview Start"] && (
                            <span className="text-xs text-gray-400">
                              {new Date(candidate["Interview Start"]).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-candidates" disabled>
                      No candidates found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Interview Hub</h1>
              <p className="text-gray-600">
                {timeStatus === 'ongoing' ? 'Interview currently in progress' : 
                 timeStatus === 'manual' ? 'Manually selected candidate' : 'Next scheduled interview'}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  timeStatus === 'ongoing' ? 'bg-red-100 text-red-800' :
                  timeStatus === 'manual' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {timeStatus === 'ongoing' ? '🔴 Live' : 
                   timeStatus === 'manual' ? '👤 Manual' : '⏰ Upcoming'}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {displayCandidate?.interviewDate} at {displayCandidate?.interviewTime}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleViewResume}
                disabled={!displayCandidate?.["Resume Link"]}
                data-testid="button-view-resume"
              >
                View Full Resume
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                data-testid="button-refresh-interview"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Current Candidate Info */}
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900" data-testid="text-candidate-name">
                  {displayCandidate["Candidate Name"]}
                </h2>
                <p className="text-gray-600" data-testid="text-job-title">
                  {displayCandidate["Job Title"]}
                </p>
                <p className="text-sm text-gray-500" data-testid="text-email">
                  {displayCandidate.Email}
                </p>
                {displayCandidate.status && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                    displayCandidate.status === 'Hired' ? 'bg-emerald-100 text-emerald-800' :
                    displayCandidate.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                    displayCandidate.status === 'Analysis Complete' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`} data-testid="badge-candidate-status">
                    {displayCandidate.status}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Interview Time</p>
                <p className="text-sm text-gray-500" data-testid="text-interview-date">
                  {displayCandidate.interviewDate}
                </p>
                <p className="text-sm text-gray-500" data-testid="text-interview-time">
                  {displayCandidate.interviewTime}
                </p>
                {displayCandidate["Google Meet Id"] && (
                  <a 
                    href={`https://${displayCandidate["Google Meet Id"]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                    data-testid="link-join-meeting"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* LiveInterviewHub Component */}
          <LiveInterviewHub candidate={displayCandidate} />
        </div>
      </div>
    </div>
  );
}