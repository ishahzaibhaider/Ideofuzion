import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedApiRequest } from '@/lib/auth';
import { Clock, Calendar } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';

interface CandidateWithMeeting {
  id: string;
  name: string;
  jobTitle: string;
  interviewStart: string;
  interviewEnd: string;
  calendarEventId: string;
  status: string;
}

export default function ExtendMeetingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithMeeting | null>(null);
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch all candidates with upcoming or ongoing meetings
  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ['/api/candidates/with-meetings'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', '/api/candidates/with-meetings');
      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.status}`);
      }
      return response.json() as Promise<CandidateWithMeeting[]>;
    },
    enabled: isOpen,
  });

  // Mutation to extend meeting time
  const extendMeetingMutation = useMutation({
    mutationFn: async (data: { calendarEventId: string; newEndTime: string; reason: string }) => {
      const response = await authenticatedApiRequest('POST', '/api/extend-meeting', data);
      if (!response.ok) {
        throw new Error('Failed to extend meeting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      setIsOpen(false);
      setSelectedCandidate(null);
      setNewEndTime('');
      setReason('');
      alert('Meeting time extended successfully!');
    },
    onError: (error) => {
      console.error('Error extending meeting:', error);
      alert('Failed to extend meeting time. Please try again.');
    },
  });

  const handleCandidateSelect = (candidateId: string) => {
    const candidate = candidates?.find(c => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      // Set default new end time to 30 minutes after current end time
      const currentEndTime = parseISO(candidate.interviewEnd);
      const extendedEndTime = addMinutes(currentEndTime, 30);
      setNewEndTime(format(extendedEndTime, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const handleSubmit = () => {
    if (!selectedCandidate || !newEndTime || !reason.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert to ISO format with Pakistan timezone (+05:00)
    const newEndTimeISO = `${newEndTime}:00.000+05:00`;

    extendMeetingMutation.mutate({
      calendarEventId: selectedCandidate.calendarEventId,
      newEndTime: newEndTimeISO,
      reason: reason.trim(),
    });
  };

  const formatDisplayTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return isoString;
    }
  };

  const isCurrentlyOngoing = (candidate: CandidateWithMeeting) => {
    const now = new Date();
    const start = parseISO(candidate.interviewStart);
    const end = parseISO(candidate.interviewEnd);
    return now >= start && now <= end;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Extend Meeting Time</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Extend Meeting Time</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label htmlFor="candidate">Select Candidate</Label>
            <Select onValueChange={handleCandidateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a candidate with scheduled meeting" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading candidates...</SelectItem>
                ) : error ? (
                  <SelectItem value="error" disabled>Error loading candidates: {error.message}</SelectItem>
                ) : candidates?.length ? (
                  candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{candidate.name}</span>
                        <div className="ml-4 text-sm text-gray-500">
                          {isCurrentlyOngoing(candidate) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mr-2">
                              • Ongoing
                            </span>
                          )}
                          {formatDisplayTime(candidate.interviewStart)}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No candidates with scheduled meetings found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Current Meeting Details */}
          {selectedCandidate && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Current Meeting Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Candidate:</span>
                  <p className="font-medium">{selectedCandidate.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Position:</span>
                  <p className="font-medium">{selectedCandidate.jobTitle}</p>
                </div>
                <div>
                  <span className="text-gray-600">Start Time:</span>
                  <p className="font-medium">{formatDisplayTime(selectedCandidate.interviewStart)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Current End Time:</span>
                  <p className="font-medium">{formatDisplayTime(selectedCandidate.interviewEnd)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Calendar Event ID:</span>
                  <p className="font-medium font-mono text-xs">{selectedCandidate.calendarEventId}</p>
                </div>
                {isCurrentlyOngoing(selectedCandidate) && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Currently Ongoing
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New End Time */}
          {selectedCandidate && (
            <div className="space-y-2">
              <Label htmlFor="newEndTime">New End Time</Label>
              <Input
                id="newEndTime"
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                min={format(parseISO(selectedCandidate.interviewEnd), "yyyy-MM-dd'T'HH:mm")}
              />
              <p className="text-xs text-gray-500">
                Must be after current end time: {formatDisplayTime(selectedCandidate.interviewEnd)}
              </p>
            </div>
          )}

          {/* Reason */}
          {selectedCandidate && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Extension</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Candidate had excellent questions, Discussion going well, Technical deep dive needed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCandidate || !newEndTime || !reason.trim() || extendMeetingMutation.isPending}
          >
            {extendMeetingMutation.isPending ? 'Extending...' : 'Extend Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}