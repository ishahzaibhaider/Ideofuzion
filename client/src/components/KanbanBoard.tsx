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
  { id: 'Interview Scheduled', title: 'Interview Scheduled', color: 'yellow' },
  { id: 'Analysis Complete', title: 'Analysis Phase', color: 'purple' },
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
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'green':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {COLUMNS.map((column) => {
        const columnCandidates = candidates.filter(c => c.status === column.id);
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    {column.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeColor(column.color)} shadow-lg`}>
                    {columnCandidates.length}
                  </span>
                </div>
              </div>
              <div 
                className="p-6 space-y-4 max-h-[500px] overflow-y-auto min-h-[400px] bg-gradient-to-b from-white/50 to-gray-50/50"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-center font-medium">No candidates in this stage</p>
                    <p className="text-xs text-gray-300 mt-1">Drag candidates here to update their status</p>
                  </div>
                ) : (
                  columnCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="transform hover:scale-105 transition-transform duration-200"
                    >
                      <CandidateCard
                        candidate={candidate}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
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
