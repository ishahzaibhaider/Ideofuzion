import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import KanbanBoard from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PipelinePage() {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/candidates");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
              <div className="flex space-x-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-80">
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-4 border-b border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="p-4 space-y-3">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Candidate Pipeline</h1>
              <p className="text-gray-600">Drag and drop candidates through the hiring process</p>
            </div>
            <div className="flex space-x-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="senior-developer">Senior Developer</SelectItem>
                  <SelectItem value="product-manager">Product Manager</SelectItem>
                  <SelectItem value="ux-designer">UX Designer</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>

          {/* Kanban Board */}
          <KanbanBoard candidates={candidates || []} />
        </div>
      </div>
    </div>
  );
}
