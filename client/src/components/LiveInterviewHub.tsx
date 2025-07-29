import { useState, useEffect } from "react";
import { Candidate } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { wsManager } from "@/lib/websocket";

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
  const [suggestions, setSuggestions] = useState([
    {
      type: "Technical Deep-dive",
      question: "Can you explain how you measured the performance improvements?"
    },
    {
      type: "Problem-solving",
      question: "What challenges did you face during the optimization process?"
    },
    {
      type: "Team Collaboration",
      question: "How did you communicate these technical decisions to non-technical stakeholders?"
    }
  ]);

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
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isSessionActive ? 'Recording' : 'Not Recording'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-6 h-64 md:h-80 lg:h-96 overflow-y-auto">
          {transcript.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Transcript will appear here when the session starts</p>
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
                    <p className="text-sm text-gray-900">
                      <strong>{entry.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}:</strong> {entry.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{entry.timestamp}</p>
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
          <h3 className="text-lg font-semibold text-gray-900">AI Interview Assistant</h3>
          <p className="text-sm text-gray-600">Real-time suggestions and insights</p>
        </div>
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Current Analysis */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Current Analysis</h4>
            <p className="text-sm text-blue-800">
              Candidate is demonstrating strong technical knowledge of React performance optimization. 
              Consider asking about specific metrics or results achieved.
            </p>
          </div>
          
          {/* Suggested Questions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Suggested Follow-up Questions</h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{suggestion.type}</p>
                  <p className="text-xs text-gray-600">"{suggestion.question}"</p>
                </button>
              ))}
            </div>
          </div>
          
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
