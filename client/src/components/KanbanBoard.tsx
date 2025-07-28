import { useState } from "react";
import { Candidate } from "@shared/schema";
import CandidateCard from "./CandidateCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  candidates: Candidate[];
}

const COLUMNS = [
  { id: 'New', title: 'New Applications', color: 'blue' },
  { id: 'Qualified', title: 'Qualified', color: 'green' },
  { id: 'Interview Scheduled', title: 'Interview Scheduled', color: 'yellow' },
  { id: 'Analysis Complete', title: 'Analysis Complete', color: 'purple' },
  { id: 'Hired', title: 'Hired', color: 'success' },
];

export default function KanbanBoard({ candidates }: KanbanBoardProps) {
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateCandidateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await authenticatedApiRequest("PUT", `/api/candidates/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Success",
        description: "Candidate status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    
    if (draggedCandidate && draggedCandidate.status !== status) {
      updateCandidateMutation.mutate({
        id: draggedCandidate.id,
        status
      });
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'success':
        return 'bg-success/10 text-success';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnCandidates = candidates.filter(c => c.status === column.id);
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getBadgeColor(column.color)}`}>
                    {columnCandidates.length}
                  </span>
                </div>
              </div>
              <div 
                className="p-4 space-y-3 max-h-96 overflow-y-auto min-h-[200px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnCandidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No candidates in this stage</p>
                  </div>
                ) : (
                  columnCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
