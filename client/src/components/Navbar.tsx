import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const user = auth.getUser();

  const syncCVsMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedApiRequest("POST", "/api/sync-cvs");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "CV sync triggered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to sync CVs",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    auth.logout();
    window.location.href = "/login";
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">HP</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">Hiring Pipeline</span>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/dashboard') 
                  ? 'text-gray-900 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
              }`}>
                Dashboard
              </Link>
              <Link href="/pipeline" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/pipeline') 
                  ? 'text-gray-900 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
              }`}>
                Pipeline
              </Link>
              <Link href="/live-interview" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/live-interview') 
                  ? 'text-gray-900 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
              }`}>
                Live Interview
              </Link>
              <Link href="/candidates" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive('/candidates') 
                  ? 'text-gray-900 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
              }`}>
                Candidates
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => syncCVsMutation.mutate()}
              disabled={syncCVsMutation.isPending}
            >
              {syncCVsMutation.isPending ? "Syncing..." : "Sync New CVs"}
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900"
              >
                Logout ({user?.name})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
