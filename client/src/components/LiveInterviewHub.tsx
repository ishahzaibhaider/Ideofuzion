import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, Lightbulb, Play, PhoneCall } from 'lucide-react';
import { wsManager } from '@/lib/websocket';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Candidate, type Transcript, type Analysis } from '@shared/schema';

interface LiveInterviewHubProps {
  candidate: Candidate;
}

interface TranscriptEntry {
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export default function LiveInterviewHub({ candidate }: LiveInterviewHubProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [transcriptSummary, setTranscriptSummary] = useState('');

  // Extract Google Meet ID from candidate data for transcript matching
  // Remove the full URL prefix to get just the meet ID (e.g., "sgy-dgeg-yiz")
  const candidateMeetId = candidate["Google Meet Id"]?.replace('meet.google.com/', '').replace('https://', '') || null;

  // Query for candidate-specific transcript data for AI Assistant
  const { data: latestTranscript, refetch: refetchLatestTranscript, isLoading: isTranscriptLoading } = useQuery({
    queryKey: ["/api/transcripts/by-meet-id", candidateMeetId, candidate.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (!candidateMeetId) {
        console.log('No Google Meet ID found for candidate:', candidate["Candidate Name"]);
        return null;
      }
      
      const response = await fetch(`/api/transcripts/by-meet-id/${candidateMeetId}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No transcripts found for Meet ID:', candidateMeetId);
          return null;
        }
        throw new Error(`Failed to fetch transcript: ${response.status}`);
      }
      
      const transcriptData = await response.json();
      console.log('Fetched transcript for candidate:', candidate["Candidate Name"], transcriptData);
      return transcriptData as Transcript;
    },
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: !!candidateMeetId, // Only run query if we have a Meet ID
  });

  // Query for candidate-specific analysis data
  const { data: candidateAnalysis, refetch: refetchAnalysis, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ["/api/analysis/by-meet-id", candidateMeetId, candidate.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (!candidateMeetId) {
        console.log('No Google Meet ID found for analysis:', candidate["Candidate Name"]);
        return null;
      }
      
      const response = await fetch(`/api/analysis/by-meet-id/${candidateMeetId}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No analysis found for Meet ID:', candidateMeetId);
          return null;
        }
        throw new Error(`Failed to fetch analysis: ${response.status}`);
      }
      
      const analysisData = await response.json();
      console.log('Fetched analysis for candidate:', candidate["Candidate Name"], analysisData);
      return analysisData as Analysis;
    },
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: !!candidateMeetId, // Only run query if we have a Meet ID
  });

  // Reset AI assistant state when candidate changes
  useEffect(() => {
    setSuggestions([]);
    setTranscriptSummary('');
    setAiAnalysis('');
  }, [candidate.id]);

  // Parse suggestions from database
  useEffect(() => {
    if (latestTranscript && latestTranscript.Suggested_Questions) {
      const suggestedQuestions = (typeof latestTranscript.Suggested_Questions === 'string' 
        ? latestTranscript.Suggested_Questions 
        : latestTranscript.Suggested_Questions.join('\n')
      ).split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.trim());
      setSuggestions(suggestedQuestions);
      setTranscriptSummary(latestTranscript.Summary || "");
    } else {
      // Clear suggestions if no transcript data
      setSuggestions([]);
      setTranscriptSummary('');
    }
  }, [latestTranscript]);

  const handleStartInterview = async () => {
    setIsSessionActive(true);
    
    try {
      const response = await apiRequest("POST", "/api/start-interview-bot", {
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        interviewTime: new Date().toISOString(),
        googleMeetLink: candidate["Google Meet Id"] || `https://meet.google.com/example-${candidate.id}`
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to start interview bot:', errorData);
        alert('Failed to start interview session. Please ensure N8N workflow is active.');
        setIsSessionActive(false);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview session. Please check your connection.');
      setIsSessionActive(false);
    }
  };

  const handleStopInterview = () => {
    setIsSessionActive(false);
    setTranscript([]);
  };

  const handleReloadAIAssistant = async () => {
    try {
      console.log('Reloading AI Assistant and Analysis data...');
      await Promise.all([refetchLatestTranscript(), refetchAnalysis()]);
      console.log('AI Assistant and Analysis data reloaded successfully');
    } catch (error) {
      console.error('Failed to reload AI Assistant and Analysis data:', error);
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[calc(100vh-12rem)]">
      {/* Left Panel: Candidate Info */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Candidate Profile</h3>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
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
            
            <div className="pt-4 border-t border-gray-200 space-y-3">
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
              
              {/* Start/Stop Interview Session */}
              <div className="flex gap-3">
                {!isSessionActive ? (
                  <Button 
                    onClick={handleStartInterview} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopInterview} 
                    variant="destructive"
                    className="flex-1"
                  >
                    <PhoneCall className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                )}
              </div>
              
              {isSessionActive && (
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Interview session active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: AI Interview Assistant - Enhanced Layout (spans 2 columns) */}
      <div className="xl:col-span-2 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Interview Assistant</h3>
              <p className="text-sm text-gray-600">AI-powered insights from interview transcripts</p>
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
        
        <div className="flex-1 p-6 space-y-6">
          {/* Interview Summary - Prominent Display */}
          {transcriptSummary ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Interview Summary</h4>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-3">
                {transcriptSummary.split('\n').filter(line => line.trim()).map((line, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {line.trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : !isTranscriptLoading && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-500">Interview Summary</h4>
              </div>
              <p className="text-sm text-gray-500">
                No summary available yet. Click reload to fetch latest data.
              </p>
            </div>
          )}

          {/* Final Analysis - Comprehensive Display */}
          {candidateAnalysis ? (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h4 className="text-lg font-semibold text-gray-900">Final Analysis</h4>
              </div>
              <div className="space-y-4">
                {/* Psychometric Analysis */}
                {candidateAnalysis["Psychometric Analysis"] && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="text-sm font-semibold text-purple-700 mb-2">Psychometric Analysis</h5>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {candidateAnalysis["Psychometric Analysis"]}
                    </p>
                  </div>
                )}
                
                {/* Technical Analysis */}
                {candidateAnalysis["Technical Analysis"] && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="text-sm font-semibold text-purple-700 mb-2">Technical Analysis</h5>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {candidateAnalysis["Technical Analysis"]}
                    </p>
                  </div>
                )}
                
                {/* Behavioural Analysis */}
                {candidateAnalysis["Behavioural Analysis"] && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h5 className="text-sm font-semibold text-purple-700 mb-2">Behavioural Analysis</h5>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {candidateAnalysis["Behavioural Analysis"]}
                    </p>
                  </div>
                )}
                
                {/* Hiring Recommendation */}
                {candidateAnalysis["Recommended for Hire"] && (
                  <div className={`rounded-lg p-4 border-2 ${
                    candidateAnalysis["Recommended for Hire"].toLowerCase().includes('yes') || 
                    candidateAnalysis["Recommended for Hire"].toLowerCase().includes('recommend')
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <h5 className={`text-sm font-bold mb-2 ${
                      candidateAnalysis["Recommended for Hire"].toLowerCase().includes('yes') || 
                      candidateAnalysis["Recommended for Hire"].toLowerCase().includes('recommend')
                        ? 'text-emerald-700' 
                        : 'text-red-700'
                    }`}>
                      Hiring Recommendation
                    </h5>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      {candidateAnalysis["Recommended for Hire"]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : !isAnalysisLoading && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-500">Final Analysis</h4>
              </div>
              <p className="text-sm text-gray-500">
                No analysis available yet. Analysis will appear after interview completion.
              </p>
            </div>
          )}

          {/* Suggested Questions - Enhanced Layout */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              <h4 className="text-lg font-semibold text-gray-900">AI Suggested Questions</h4>
              {isTranscriptLoading && (
                <span className="text-xs text-gray-500">(Loading...)</span>
              )}
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
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
                      className="bg-white rounded-lg p-4 border border-emerald-200 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold">
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
                <div className="text-center py-6 text-gray-500">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    {isTranscriptLoading ? 'Loading suggestions...' : 'No AI suggestions available yet'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isTranscriptLoading ? 'Please wait...' : 'Click reload to fetch latest data'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}