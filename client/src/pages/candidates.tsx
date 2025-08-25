import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Search, Edit2, Eye, Trash2, MoreVertical } from "lucide-react";
import { Candidate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editForm, setEditForm] = useState<Partial<Candidate>>({});
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  // Check URL params to set initial filter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam) {
      setStatusFilter(filterParam);
    }
  }, []);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/candidates");
      return response.json();
    },
  });

  const updateCandidateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Candidate> }) => {
      const response = await authenticatedApiRequest("PUT", `/api/candidates/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      setEditingCandidate(null);
      setEditForm({});
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Candidate updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update candidate",
        variant: "destructive",
      });
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedApiRequest("DELETE", `/api/candidates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Success",
        description: "Candidate deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive",
      });
    },
  });

  // Filter candidates based on search and status - using normalized field names
  const filteredCandidates = candidates?.filter((candidate: Candidate) => {
    const candidateName = candidate["Candidate Name"] || '';
    const candidateEmail = candidate.Email || '';
    const candidateRole = candidate["Job Title"] || '';

    const matchesSearch = searchTerm === "" ||
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidateRole.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'New': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Interview Scheduled': 'bg-yellow-100 text-yellow-800',
      'Analysis Complete': 'bg-purple-100 text-purple-800',
      'Hired': 'bg-success/10 text-success',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayText = (status: string) => {
    return status === 'Analysis Complete' ? 'Analysis Ongoing' : status;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Helper function to get initials safely
  const getInitials = (name: string) => {
    if (!name) return 'UN';
    return name.split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div className="backdrop-blur-sm bg-white/30 rounded-2xl p-6 shadow-lg border border-white/20">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                All Candidates
              </h1>
              <p className="text-gray-700 mt-1">Manage and track all candidates in your pipeline</p>
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search candidates..."
                  className="pl-10 w-64 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="Analysis Complete">Analysis Ongoing</SelectItem>
                  <SelectItem value="Hired">Hired</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-500">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCandidates?.map((candidate: Candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {getInitials(candidate["Candidate Name"] || '')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{candidate["Candidate Name"] || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{candidate.Email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{candidate["Job Title"] || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{candidate["Interview Start"] || 'N/A'} | {candidate["Interview End"] || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadge(candidate.status || "New")}>
                          {getStatusDisplayText(candidate.status || "New")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate["Interview Start"] || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowViewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCandidate(candidate);
                                setEditForm({
                                  "Candidate Name": candidate["Candidate Name"],
                                  Email: candidate.Email,
                                  "Job Title": candidate["Job Title"],
                                  "Interview Start": candidate["Interview Start"],
                                  "Interview End": candidate["Interview End"],
                                  status: candidate.status || "New"
                                });
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${candidate["Candidate Name"] || 'this candidate'}?`)) {
                                  deleteCandidateMutation.mutate(candidate.id);
                                }
                              }}
                              disabled={deleteCandidateMutation.isPending}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deleteCandidateMutation.isPending ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">{filteredCandidates?.length || 0}</span> of{" "}
                    <span className="font-medium">{candidates?.length || 0}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button variant="outline" size="sm" className="rounded-r-none">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-l-none border-l-0">
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Dialog - Separate from dropdown */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
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
                <Badge className={getStatusBadge(selectedCandidate.status || "New")}>
                  {selectedCandidate.status || "New"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Interview Date</Label>
                <p className="text-sm text-gray-900">{selectedCandidate["Interview Start"] ? new Date(selectedCandidate["Interview Start"]).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Interview Time</Label>
                <p className="text-sm text-gray-900">{selectedCandidate["Interview Start"] ? new Date(selectedCandidate["Interview Start"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-500">Calendar Event ID</Label>
                <p className="text-sm text-gray-900">{selectedCandidate["Calendar Event ID"] || 'N/A'}</p>
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
              {selectedCandidate["Resume Link"] && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Resume Link</Label>
                  <a
                    href={selectedCandidate["Resume Link"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {selectedCandidate["Resume Link"]}
                  </a>
                </div>
              )}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Skills</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCandidate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedCandidate.experience && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Experience</Label>
                  <p className="text-sm text-gray-900">{selectedCandidate.experience}</p>
                </div>
              )}
              {selectedCandidate.education && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Education</Label>
                  <p className="text-sm text-gray-900">{selectedCandidate.education}</p>
                </div>
              )}
              {selectedCandidate.cvUrl && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">CV/Resume</Label>
                  <a
                    href={selectedCandidate.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View CV/Resume
                  </a>
                </div>
              )}
              {selectedCandidate.analysis && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Analysis</Label>
                  <div className="text-sm text-gray-900 space-y-2">
                    {selectedCandidate.analysis.summary && (
                      <div>
                        <p className="font-medium">Summary:</p>
                        <p>{selectedCandidate.analysis.summary}</p>
                      </div>
                    )}
                    {selectedCandidate.analysis.technicalScore && (
                      <div>
                        <p className="font-medium">Technical Score: {selectedCandidate.analysis.technicalScore}/100</p>
                      </div>
                    )}
                    {selectedCandidate.analysis.psychometricAnalysis && (
                      <div>
                        <p className="font-medium">Psychometric Analysis:</p>
                        <p>{selectedCandidate.analysis.psychometricAnalysis}</p>
                      </div>
                    )}
                    {selectedCandidate.analysis.finalRecommendation && (
                      <div>
                        <p className="font-medium">Final Recommendation:</p>
                        <p>{selectedCandidate.analysis.finalRecommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Separate from dropdown */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
          </DialogHeader>
          {editingCandidate && (
            <div className="grid grid-cols-1 gap-4 py-4">
              <div>
                <Label htmlFor="name">Candidate Name</Label>
                <Input
                  id="name"
                  value={editForm["Candidate Name"] || ""}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, "Candidate Name": e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.Email || ""}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, Email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="previousRole">Job Title</Label>
                <Input
                  id="previousRole"
                  value={editForm["Job Title"] || ""}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, "Job Title": e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="interviewDate">Interview Date</Label>
                <Input
                  id="interviewDate"
                  type="date"
                  value={editForm["Interview Start"] || ""}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, "Interview Start": e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="interviewTime">Interview Time</Label>
                <Input
                  id="interviewTime"
                  value={editForm["Interview End"] || ""}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, "Interview End": e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status || "New"} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="Analysis Complete">Analysis Ongoing</SelectItem>
                    <SelectItem value="Hired">Hired</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCandidate(null);
                    setEditForm({});
                    setShowEditDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateCandidateMutation.mutate({
                      id: editingCandidate.id,
                      updates: editForm
                    });
                  }}
                  disabled={updateCandidateMutation.isPending}
                >
                  {updateCandidateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
