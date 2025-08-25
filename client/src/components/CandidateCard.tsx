import { useState } from "react";
import { Candidate } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Eye, Edit, Calendar, Video } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface CandidateCardProps {
  candidate: Candidate;
  onDragStart?: (e: React.DragEvent, candidate: Candidate) => void;
  onDragEnd?: () => void;
}

export default function CandidateCard({ candidate, onDragStart, onDragEnd }: CandidateCardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Qualified':
        return 'bg-green-100 text-green-800';
      case 'Interview Scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'Analysis Complete':
        return 'bg-purple-100 text-purple-800';
      case 'Hired':
        return 'bg-success/10 text-success';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'UN';
    return name.split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Applied 1 day ago';
    return `Applied ${diffDays} days ago`;
  };

  return (
    <div 
      className="bg-white/95 backdrop-blur-sm border border-white/30 rounded-xl p-4 cursor-grab hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white active:cursor-grabbing active:rotate-2 active:scale-105"
      draggable={true}
      onDragStart={(e) => onDragStart?.(e, candidate)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-indigo-700">
              {getInitials(candidate["Candidate Name"] || '')}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{candidate["Candidate Name"]}</p>
            <p className="text-sm text-gray-600">{candidate["Job Title"] || 'N/A'}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  setSelectedCandidate(candidate);
                }}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Candidate Details</DialogTitle>
                </DialogHeader>
                {selectedCandidate && (
                  <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Candidate Name</Label>
                      <p className="text-sm text-gray-900">{selectedCandidate["Candidate Name"] || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm text-gray-900">{selectedCandidate.Email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Job Title</Label>
                      <p className="text-sm text-gray-900">{selectedCandidate["Job Title"] || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <Badge className={getStatusColor(selectedCandidate.status || "New")}>
                        {selectedCandidate.status || "New"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Interview Date</Label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedCandidate["Interview Start"])}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Interview Time</Label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedCandidate["Interview Start"])}</p>
                    </div>
                    {selectedCandidate["Calender Event Link"] && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500">Calendar Event Link</Label>
                        <a 
                          href={selectedCandidate["Calender Event Link"]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {selectedCandidate["Calender Event Link"]}
                        </a>
                      </div>
                    )}
                    {selectedCandidate["Google Meet Id"] && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500">Google Meet ID</Label>
                        <a 
                          href={`https://${selectedCandidate["Google Meet Id"]}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedCandidate["Google Meet Id"]}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
            {candidate["Calender Event Link"] && (
              <DropdownMenuItem onClick={() => window.open(candidate["Calender Event Link"], '_blank')}>
                <Calendar className="w-4 h-4 mr-2" />
                Open Calendar
              </DropdownMenuItem>
            )}
            {candidate["Google Meet Id"] && (
              <DropdownMenuItem onClick={() => window.open(`https://${candidate["Google Meet Id"]}`, '_blank')}>
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {candidate.skills?.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {candidate.skills && candidate.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{candidate.skills.length - 3}
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-600">{candidate.Email}</p>
        <p className="text-xs text-gray-500">{formatDate(candidate.appliedDate || null)}</p>
        
        {candidate.status === 'Interview Scheduled' && candidate["Interview Start"] && (
          <div className="mt-2">
            <Badge className={getStatusColor(candidate.status)}>
              {formatDateTime(candidate["Interview Start"])}
            </Badge>
          </div>
        )}
        
        {candidate.status === 'Analysis Complete' && candidate.score && (
          <div className="mt-2">
            <span className="text-sm font-medium text-green-600">Score: {candidate.score}/100</span>
          </div>
        )}
      </div>
    </div>
  );
}
