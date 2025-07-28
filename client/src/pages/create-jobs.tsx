import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { X, Edit, PlusCircle } from "lucide-react";

// Define the structure of the job data fetched from the backend
interface Job {
  id: string;
  "Job ID": string;
  "Job Title": string;
  "Required Skills": string[];
}

// Define the structure for creating/updating a job
interface JobFormData {
  jobId: string;
  jobTitle: string;
  requiredSkills: string[];
}

// The main component, now for managing jobs
export default function ManageJobsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [jobId, setJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");

  const { toast } = useToast();

  // Fetch all existing jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/job-criteria"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/job-criteria");
      return response.json();
    },
  });

  // Mutation for creating a new job
  const createJobMutation = useMutation({
    mutationFn: async (newJob: JobFormData) => {
      const response = await authenticatedApiRequest("POST", "/api/jobs", newJob);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-criteria"] });
      toast({
        title: "Success!",
        description: "The new job has been posted successfully.",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Job",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating an existing job
  const updateJobMutation = useMutation({
    mutationFn: async (updatedJob: Job) => {
      const { id, ...jobData } = updatedJob;
      const payload = {
        jobId: jobData["Job ID"],
        jobTitle: jobData["Job Title"],
        requiredSkills: jobData["Required Skills"],
      }
      const response = await authenticatedApiRequest("PUT", `/api/jobs/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-criteria"] });
      toast({
        title: "Success!",
        description: "The job has been updated successfully.",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Job",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Effect to populate form when editing
  useEffect(() => {
    if (editingJob) {
      setJobId(editingJob["Job ID"]);
      setJobTitle(editingJob["Job Title"]);
      setSkills(editingJob["Required Skills"]);
    } else {
      // Reset form when not editing
      setJobId("");
      setJobTitle("");
      setSkills([]);
    }
    setCurrentSkill("");
  }, [editingJob, isFormOpen]);


  const handleAddSkill = () => {
    const trimmedSkill = currentSkill.trim().toLowerCase();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setCurrentSkill("");
    }
  };

  const handleSkillInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId || !jobTitle || skills.length === 0) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all fields and add at least one skill.",
        variant: "destructive",
      });
      return;
    }

    const jobDetails: JobFormData = { jobId, jobTitle, requiredSkills: skills };

    if (editingJob) {
      updateJobMutation.mutate({ ...jobDetails, id: editingJob.id, "Job ID": jobId, "Job Title": jobTitle, "Required Skills": skills });
    } else {
      createJobMutation.mutate(jobDetails);
    }
  };

  const handleOpenForm = (job: Job | null) => {
    setEditingJob(job);
    setIsFormOpen(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Job Postings</h1>
              <p className="text-gray-600">
                Create, view, and edit all job postings.
              </p>
            </div>
            <Button onClick={() => handleOpenForm(null)}>
              <PlusCircle className="w-4 h-4 mr-2"/>
              Create New Job
            </Button>
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Skills</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr><td colSpan={4} className="text-center p-4">Loading jobs...</td></tr>
                  ) : jobs?.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job["Job Title"]}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job["Job ID"]}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {job["Required Skills"].map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenForm(job)}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Form Dialog for Create/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="p-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="form-jobTitle">Job Title</Label>
                  <Input id="form-jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="form-jobId">Job ID</Label>
                  <Input id="form-jobId" value={jobId} onChange={(e) => setJobId(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="form-skills">Required Skills</Label>
                <div className="flex items-center gap-2">
                  <Input id="form-skills" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={handleSkillInputKeyPress} placeholder="Add a skill and press Enter" />
                  <Button type="button" onClick={handleAddSkill}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 min-h-[42px] rounded-md border p-2">
                  {skills.length > 0 ? skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 rounded-full hover:bg-gray-300/50 p-0.5"><X className="h-3 w-3" /></button>
                    </Badge>
                  )) : <p className="text-sm text-gray-500 px-1">No skills added.</p>}
                </div>
              </div>
            </div>
            <DialogFooter className="px-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createJobMutation.isPending || updateJobMutation.isPending}>
                {editingJob 
                  ? (updateJobMutation.isPending ? "Saving..." : "Save Changes")
                  : (createJobMutation.isPending ? "Creating..." : "Create Job")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
