import { Candidate } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface CandidateCardProps {
  candidate: Candidate;
  onDragStart?: (e: React.DragEvent, candidate: Candidate) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export default function CandidateCard({ candidate, onDragStart, onDragEnd }: CandidateCardProps) {
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
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-grab hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => onDragStart?.(e, candidate)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{candidate.name}</p>
            <p className="text-sm text-gray-500">{candidate.previousRole || 'N/A'}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
          </svg>
        </button>
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
        
        <p className="text-sm text-gray-600">{candidate.experience}</p>
        <p className="text-xs text-gray-500">{formatDate(candidate.appliedDate)}</p>
        
        {candidate.status === 'Interview Scheduled' && candidate.interviewDetails?.dateTime && (
          <div className="mt-2">
            <Badge className={getStatusColor(candidate.status)}>
              {new Date(candidate.interviewDetails.dateTime).toLocaleDateString()} at{' '}
              {new Date(candidate.interviewDetails.dateTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Badge>
          </div>
        )}
        
        {candidate.status === 'Analysis Complete' && candidate.score && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-success">Score: {candidate.score}/100</span>
            <button className="text-primary hover:text-primary/80 font-medium text-sm">
              View Report
            </button>
          </div>
        )}
        
        {candidate.status === 'Interview Scheduled' && (
          <button className="text-primary hover:text-primary/80 font-medium text-sm">
            Join Interview
          </button>
        )}
      </div>
    </div>
  );
}
