import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import LiveInterviewHub from "@/components/LiveInterviewHub";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function LiveInterviewPage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const { toast } = useToast();

  const { data: candidates } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/candidates");
      return response.json();
    },
  });

  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedApiRequest("POST", "/api/start-interview-bot", {
        meetingId: `interview-${Date.now()}`,
        candidateId: currentCandidate?.id
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSessionActive(true);
      toast({
        title: "Success",
        description: "Interview session started successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start interview session",
        variant: "destructive",
      });
    },
  });

  // Get the first candidate with interview scheduled for demo
  // Assuming your Candidate type has a 'resumeUrl' property
  const currentCandidate = candidates?.find((c: any) => c.status === 'Interview Scheduled') || candidates?.[0];

  const handleStartSession = () => {
    startInterviewMutation.mutate();
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    toast({
      title: "Session Ended",
      description: "Interview session has been ended",
    });
  };

  // ✨ New handler function to open the resume link
  const handleViewResume = () => {
    if (currentCandidate?.resumeUrl) {
      // Opens the link in a new tab with security best practices
      window.open(currentCandidate.resumeUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No Resume",
        description: "A resume link is not available for this candidate.",
        variant: "destructive",
      });
    }
  };


  if (!currentCandidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Interview Scheduled</h2>
              <p className="text-gray-600">There are no candidates scheduled for interviews at this time.</p>
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
              <p className="text-gray-600">Real-time interview monitoring and AI assistance</p>
            </div>
            <div className="flex space-x-3">
              {/* ✨ New "View Resume" Button */}
              <Button
                variant="outline"
                onClick={handleViewResume}
                disabled={!currentCandidate?.resumeUrl}
              >
                View Resume
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndSession}
                disabled={!isSessionActive}
              >
                End Session
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleStartSession}
                disabled={isSessionActive || startInterviewMutation.isPending}
              >
                {startInterviewMutation.isPending ? "Starting..." : "Start Session"}
              </Button>
            </div>
          </div>

          {/* 3-Panel Layout */}
          <LiveInterviewHub
            candidate={currentCandidate}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            isSessionActive={isSessionActive}
          />
        </div>
      </div>
    </div>
  );
}