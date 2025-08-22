import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { isValidCompanyEmail, getEmailDomain } from "@/lib/utils";
import { CheckCircle, XCircle, Building2 } from "lucide-react";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      toast({
        title: "Authentication Error",
        description: error === 'google' ? "Google authentication failed" : "OAuth error occurred",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch user info');
      })
      .then(user => {
        localStorage.setItem("user", JSON.stringify(user));
        toast({
          title: "Success",
          description: "Successfully signed up with Google",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        setLocation("/dashboard");
      })
      .catch(error => {
        console.error('Error fetching user info:', error);
        localStorage.removeItem("token");
        toast({
          title: "Error",
          description: "Failed to complete authentication",
          variant: "destructive",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, [toast, setLocation]);

  // Validate email when it changes
  useEffect(() => {
    if (email.trim()) {
      const isValid = isValidCompanyEmail(email);
      setIsEmailValid(isValid);
    } else {
      setIsEmailValid(null);
    }
  }, [email]);

  const handleGoogleSignup = () => {
    if (!isEmailValid) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid company email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsGoogleLoading(true);
    const backendBase = window.location.origin;
    // Pass email as state parameter for the OAuth flow
    window.location.href = `${backendBase}/auth/google?email=${encodeURIComponent(email)}`;
  };

  const getEmailValidationMessage = () => {
    if (email.trim() === "") return null;
    
    if (isEmailValid) {
      return {
        type: "success" as const,
        message: `Valid company email: ${getEmailDomain(email)}`,
        icon: CheckCircle
      };
    } else {
      return {
        type: "error" as const,
        message: "Please use your company email address (personal emails like Gmail are not allowed)",
        icon: XCircle
      };
    }
  };

  const validationMessage = getEmailValidationMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">HP</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Join our platform</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started with hiring intelligence
          </p>
        </div>
        
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">Sign up</CardTitle>
            <CardDescription className="text-center">
              Use your company email to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Input Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your company email (e.g., john@company.com)"
                  className={`h-12 border-2 transition-colors ${
                    isEmailValid === null 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      : isEmailValid 
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  }`}
                />
              </div>

              {/* Email Validation Message */}
              {validationMessage && (
                <Alert className={`border-2 ${
                  validationMessage.type === 'success' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <validationMessage.icon className={`h-4 w-4 ${
                    validationMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <AlertDescription className={`${
                    validationMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validationMessage.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Google Signup Button */}
            <div className="space-y-3">
              <Button
                type="button"
                className={`w-full h-12 flex items-center justify-center gap-3 transition-all duration-200 ${
                  isEmailValid 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={handleGoogleSignup}
                disabled={!isEmailValid || isGoogleLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isGoogleLoading ? "Creating account..." : "Sign up with Google"}
              </Button>
              
              {!isEmailValid && email.trim() && (
                <p className="text-xs text-gray-500 text-center">
                  Please enter a valid company email to continue
                </p>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Company Email Required
                  </p>
                  <p className="text-xs text-blue-700">
                    We only accept company email addresses to ensure secure access for business users. 
                    Personal email providers like Gmail, Yahoo, or Outlook are not allowed.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <Link 
                href="/login" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Already have an account? Sign in
              </Link>
              <div className="pt-2">
                <Link 
                  href="/privacy-policy" 
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
