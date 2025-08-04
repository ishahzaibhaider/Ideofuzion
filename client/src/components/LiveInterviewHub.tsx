import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Candidate, Transcript } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Lightbulb, FileText } from "lucide-react";
import { wsManager } from "@/lib/websocket";
import { authenticatedApiRequest } from "@/lib/auth";

interface LiveInterviewHubProps {
  candidate: Candidate;
  onStartSession: () => void;
  onEndSession: () => void;
  isSessionActive: boolean;
}

interface TranscriptEntry {
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

interface AIAnalysis {
  technicalKnowledge: number;
  communication: number;
  problemSolving: number;
}

export default function LiveInterviewHub({ 
  candidate, 
  onStartSession, 
  onEndSession,
  isSessionActive 
}: LiveInterviewHubProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({
    technicalKnowledge: 85,
    communication: 90,
    problemSolving: 75
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [transcriptSummary, setTranscriptSummary] = useState<string>("");

  // Query for latest transcript data
  const { data: latestTranscript, refetch: refetchTranscript, isLoading: isTranscriptLoading } = useQuery({
    queryKey: ["/api/transcripts/latest"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/transcripts/latest");
      return response.json() as Promise<Transcript>;
    },
    refetchOnWindowFocus: false,
  });

  // Query for latest transcripts for live transcript display
  const { data: allTranscripts, refetch: refetchAllTranscripts, isLoading: isAllTranscriptsLoading } = useQuery({
    queryKey: ["/api/transcripts/latest-for-display"],
    queryFn: async () => {
      // Get the latest transcript for display
      const response = await authenticatedApiRequest("GET", "/api/transcripts/latest");
      const latestTranscript = await response.json() as Transcript;
      return latestTranscript ? [latestTranscript] : [];
    },
    refetchOnWindowFocus: false,
    enabled: !!candidate,
  });

  // Update suggestions and summary when transcript data changes
  useEffect(() => {
    if (latestTranscript) {
      setSuggestions(latestTranscript.Suggested_Questions || []);
      setTranscriptSummary(latestTranscript.Summary || "");
    }
  }, [latestTranscript]);

  // Update transcript display with real data from database - latest first
  useEffect(() => {
    if (allTranscripts && allTranscripts.length > 0) {
      const latestTranscript = allTranscripts[0]; // Get the most recent transcript
      const formattedTranscripts: TranscriptEntry[] = [];
      
      // Create timestamp for this transcript
      const baseTimestamp = latestTranscript.createdAt ? 
        new Date(latestTranscript.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add each speaker's content as separate entries
      if (latestTranscript.Speaker1) {
        formattedTranscripts.push({
          speaker: 'interviewer',
          text: latestTranscript.Speaker1,
          timestamp: baseTimestamp
        });
      }
      
      if (latestTranscript.Speaker2) {
        formattedTranscripts.push({
          speaker: 'candidate',
          text: latestTranscript.Speaker2,
          timestamp: baseTimestamp
        });
      }
      
      if (latestTranscript.Speaker3) {
        formattedTranscripts.push({
          speaker: 'interviewer',
          text: latestTranscript.Speaker3,
          timestamp: baseTimestamp
        });
      }
      
      // Clear any old transcript data and set new one
      setTranscript(formattedTranscripts);
      
      console.log('Updated transcript with latest data:', {
        transcriptId: latestTranscript.id,
        hasS1: !!latestTranscript.Speaker1,
        hasS2: !!latestTranscript.Speaker2,
        hasS3: !!latestTranscript.Speaker3,
        entriesCreated: formattedTranscripts.length
      });
    } else {
      // Clear transcript if no data
      setTranscript([]);
    }
  }, [allTranscripts]);

  const handleReloadAIAssistant = async () => {
    try {
      await refetchTranscript();
      console.log('AI Assistant data reloaded successfully');
    } catch (error) {
      console.error('Failed to reload AI Assistant data:', error);
    }
  };

  const handleReloadTranscripts = async () => {
    try {
      console.log('Reloading latest transcript data...');
      await refetchAllTranscripts();
      console.log('Latest transcript reloaded successfully');
    } catch (error) {
      console.error('Failed to reload latest transcript:', error);
    }
  };

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    wsManager.connect(`interview-${candidate.id}`);

    const handleLiveUpdate = (data: any) => {
      if (data.transcript) {
        setTranscript(prev => [...prev, ...data.transcript]);
      }
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    };

    wsManager.on('live-update', handleLiveUpdate);

    return () => {
      wsManager.off('live-update', handleLiveUpdate);
      wsManager.disconnect();
    };
  }, [candidate.id]);

  // Simulate real-time transcript for demo
  useEffect(() => {
    if (isSessionActive) {
      const interval = setInterval(() => {
        const sampleEntries = [
          {
            speaker: 'interviewer' as const,
            text: 'Can you walk me through your experience with React and how you\'ve used it in your recent projects?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            speaker: 'candidate' as const,
            text: 'Absolutely. I\'ve been working with React for about 5 years now. In my most recent role at TechCorp, I led the development of a customer dashboard using React 18 with hooks and context API for state management...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];

        if (Math.random() > 0.7) {
          const entry = sampleEntries[Math.floor(Math.random() * sampleEntries.length)];
          setTranscript(prev => [...prev, entry]);
        }
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [isSessionActive]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 min-h-[calc(100vh-12rem)]">
      {/* Left Panel: Candidate Info */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Candidate Profile</h3>
        </div>
        <div className="p-4 lg:p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-600">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900">{candidate.name}</h4>
            <p className="text-gray-600">{candidate.previousRole || 'N/A'}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Experience</h5>
              <p className="text-sm text-gray-600">{candidate.experience}</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Key Skills</h5>
              <div className="flex flex-wrap gap-2">
                {candidate.skills?.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Previous Role</h5>
              <p className="text-sm text-gray-600">{candidate.previousRole}</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Education</h5>
              <p className="text-sm text-gray-600">{candidate.education}</p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  if (candidate["Resume Link"]) {
                    window.open(candidate["Resume Link"], '_blank', 'noopener,noreferrer');
                  } else {
                    console.log('No resume link available for this candidate');
                  }
                }}
                disabled={!candidate["Resume Link"]}
              >
                View Full Resume
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel: Live Transcript */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadTranscripts}
                disabled={isAllTranscriptsLoading}
                className="p-2"
              >
                <RefreshCw className={`w-4 h-4 ${isAllTranscriptsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isSessionActive ? 'Recording' : 'Not Recording'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-6 h-64 md:h-80 lg:h-96 overflow-y-auto">
          {transcript.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">
                {isAllTranscriptsLoading ? 'Loading latest transcript...' : 'No transcripts available yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isAllTranscriptsLoading ? 'Please wait...' : 'Click reload to fetch the latest conversation data'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((entry, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    entry.speaker === 'interviewer' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {entry.speaker === 'interviewer' ? 'I' : 'C'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 space-y-1">
                      <strong className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {entry.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}
                      </strong>
                      <div className="space-y-1">
                        {entry.text.split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                          <p key={lineIndex} className="text-sm leading-relaxed">
                            {line.trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{entry.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path>
            </svg>
            <span>Audio quality: Excellent</span>
          </div>
        </div>
      </div>

      {/* Right Panel: AI Suggestions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Interview Assistant</h3>
              <p className="text-sm text-gray-600">AI-powered suggestions from interview transcripts</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadAIAssistant}
              disabled={isTranscriptLoading}
              className="p-2"
            >
              <RefreshCw className={`w-4 h-4 ${isTranscriptLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Transcript Summary */}
          {transcriptSummary ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Interview Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                  {transcriptSummary.split('\n').filter(line => line.trim()).map((line, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      <p className="text-sm leading-relaxed">
                        {line.trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : !isTranscriptLoading && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-400">
                  <FileText className="w-4 h-4" />
                  Interview Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 italic">
                  No summary available yet. Click reload to fetch latest data.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Suggested Questions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              AI Suggested Questions
              {isTranscriptLoading && (
                <span className="text-xs text-gray-500">(Loading...)</span>
              )}
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {suggestions.length > 0 ? (
                (() => {
                  // Flatten all suggestions and split by line breaks
                  const allQuestions: string[] = [];
                  suggestions.forEach(suggestion => {
                    const lines = suggestion.split('\n').filter(line => line.trim());
                    allQuestions.push(...lines);
                  });
                  
                  return allQuestions.map((question, index) => (
                    <div 
                      key={index}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {question.trim()}
                        </p>
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    {isTranscriptLoading ? 'Loading suggestions...' : 'No AI suggestions available yet'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isTranscriptLoading ? 'Please wait...' : 'Click reload to fetch latest data'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />
          
          {/* Skills Assessment */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Skills Assessment</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Technical Knowledge</span>
                  <span className="font-medium text-success">{aiAnalysis.technicalKnowledge}/100</span>
                </div>
                <Progress value={aiAnalysis.technicalKnowledge} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Communication</span>
                  <span className="font-medium text-success">{aiAnalysis.communication}/100</span>
                </div>
                <Progress value={aiAnalysis.communication} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Problem Solving</span>
                  <span className="font-medium text-yellow-600">{aiAnalysis.problemSolving}/100</span>
                </div>
                <Progress value={aiAnalysis.problemSolving} className="h-2" />
              </div>
            </div>
          </div>
          
          {/* Interview Notes */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your interview notes here..."
              className="h-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
