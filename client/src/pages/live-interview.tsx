import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import LiveInterviewHub from "@/components/LiveInterviewHub";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Users, Clock, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Candidate } from "@shared/schema";

export default function LiveInterviewPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [manualSelection, setManualSelection] = useState(false);
  const [open, setOpen] = useState(false);
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
    enabled: false, // Disabled automatic fetching - only manual checks
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

  // Only show manually selected candidates or currently ongoing interviews (not upcoming)
  const displayCandidate = manualSelection && selectedCandidateData 
    ? selectedCandidateData 
    : (currentInterviewData?.timeStatus === 'ongoing' ? currentInterviewData?.candidate : null);
  const timeStatus = manualSelection ? 'manual' : currentInterviewData?.timeStatus;

  // Get the selected candidate object for display in combobox
  const selectedCandidate = allCandidates?.find(c => c.id === selectedCandidateId);

  // Helper function to format interview date and time from candidate data
  const getInterviewDateTime = (candidate: Candidate) => {
    if (!candidate["Interview Start"]) return { date: "N/A", time: "N/A" };
    
    const interviewStart = new Date(candidate["Interview Start"]);
    const date = interviewStart.toLocaleDateString();
    const time = interviewStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return { date, time };
  };

  // Handle candidate selection from dropdown
  const handleCandidateSelect = (candidateId: string) => {
    // Prevent duplicate selections
    if (selectedCandidateId === candidateId) return;
    
    setSelectedCandidateId(candidateId);
    setManualSelection(true);
    const candidate = allCandidates?.find(c => c.id === candidateId);
    if (candidate) {
      console.log('Selected candidate:', candidate["Candidate Name"], 'Meet ID:', candidate["Google Meet Id"]);
      toast({
        title: "Candidate Selected",
        description: `Now viewing ${candidate["Candidate Name"]}'s interview details`,
      });
    }
  };

  // Check for current ongoing interview
  const handleCheckCurrentInterview = () => {
    setManualSelection(false);
    setSelectedCandidateId(null);
    setOpen(false);
    refetch();
    toast({
      title: "Checking Current Interview",
      description: "Looking for ongoing interview based on current time",
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
              
              {/* Searchable Candidate Combobox */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    data-testid="button-select-candidate"
                  >
                    {selectedCandidate ? (
                      <div className="flex items-center">
                        <span className="font-medium">{selectedCandidate["Candidate Name"]}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {selectedCandidate["Job Title"]}
                        </span>
                      </div>
                    ) : (
                      "Search and select a candidate..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search candidates by name, job title, or email..." />
                    <CommandEmpty>No candidates found.</CommandEmpty>
                    <CommandGroup>
                      {allCandidates?.map((candidate) => (
                        <CommandItem
                          key={candidate.id}
                          value={`${candidate["Candidate Name"]} ${candidate["Job Title"]} ${candidate.Email}`}
                          onSelect={() => {
                            handleCandidateSelect(candidate.id);
                            setOpen(false);
                          }}
                          data-testid={`item-candidate-${candidate.id}`}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCandidateId === candidate.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <span className="font-medium">{candidate["Candidate Name"]}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {candidate["Job Title"]}
                              </span>
                            </div>
                            <div className="text-right">
                              {candidate["Interview Start"] && (
                                <span className="text-xs text-gray-400">
                                  {new Date(candidate["Interview Start"]).toLocaleDateString()}
                                </span>
                              )}
                              <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                candidate.status === 'Hired' ? 'bg-emerald-100 text-emerald-800' :
                                candidate.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                                candidate.status === 'Analysis Complete' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {candidate.status}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  onClick={handleCheckCurrentInterview}
                  className="flex items-center"
                  data-testid="button-reset-current"
                >
                  <Clock className="mr-1 h-4 w-4" />
                  Check Current Interview
                </Button>
              )}
            </div>
            
            {/* Searchable Candidate Combobox */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  data-testid="button-select-candidate"
                >
                  {selectedCandidate ? (
                    <div className="flex items-center">
                      <span className="font-medium">{selectedCandidate["Candidate Name"]}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {selectedCandidate["Job Title"]}
                      </span>
                    </div>
                  ) : (
                    "Search and select a candidate..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search candidates by name, job title, or email..." />
                  <CommandEmpty>No candidates found.</CommandEmpty>
                  <CommandGroup>
                    {allCandidates?.map((candidate) => (
                      <CommandItem
                        key={candidate.id}
                        value={`${candidate["Candidate Name"]} ${candidate["Job Title"]} ${candidate.Email} ${candidate.id}`}
                        onSelect={() => {
                          handleCandidateSelect(candidate.id);
                          setOpen(false);
                        }}
                        data-testid={`item-candidate-${candidate.id}`}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCandidateId === candidate.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="font-medium">{candidate["Candidate Name"]}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {candidate["Job Title"]} • ID: {candidate.id.slice(-6)}
                            </span>
                          </div>
                          <div className="text-right">
                            {candidate["Interview Start"] && (
                              <div className="text-xs text-gray-400">
                                {new Date(candidate["Interview Start"]).toLocaleDateString()} at{" "}
                                {new Date(candidate["Interview Start"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            <span className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              candidate.status === 'Hired' ? 'bg-emerald-100 text-emerald-800' :
                              candidate.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                              candidate.status === 'Analysis Complete' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {candidate.status}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
                  {displayCandidate && (() => {
                    const { date, time } = getInterviewDateTime(displayCandidate);
                    return `${date} at ${time}`;
                  })()}
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



          {/* LiveInterviewHub Component */}
          <LiveInterviewHub candidate={displayCandidate} />
        </div>
      </div>
    </div>
  );
}