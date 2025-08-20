import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Database, UserCheck, Eye, FileText, Phone, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Welcome to Hire Ninja, a comprehensive hiring pipeline and intelligence platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hiring management platform, including our real-time interview capabilities, candidate management system, and AI-powered analytics.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Name and email address (for account creation)</li>
                <li>Google account information (when using Google OAuth)</li>
                <li>Profile information and preferences</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Candidate Data</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Candidate names, emails, and contact information</li>
                <li>Resume documents and application materials</li>
                <li>Interview schedules and calendar events</li>
                <li>Interview transcripts and AI analysis</li>
                <li>Hiring pipeline status and notes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Browser type and version</li>
                <li>IP address and device information</li>
                <li>Usage patterns and analytics</li>
                <li>Session data and authentication tokens</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Meeting and Calendar Data</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Google Meet IDs and meeting links</li>
                <li>Interview timing and availability slots</li>
                <li>Calendar event synchronization data</li>
                <li>Meeting extension requests and modifications</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Core Platform Services</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Manage your hiring pipeline and candidate tracking</li>
                <li>Facilitate real-time interview assistance and AI analysis</li>
                <li>Synchronize calendar events and schedule management</li>
                <li>Provide analytics and hiring funnel insights</li>
                <li>Store and retrieve interview transcripts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Account Management</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Create and maintain your user account</li>
                <li>Authenticate access through Google OAuth</li>
                <li>Send important notifications about your account</li>
                <li>Provide customer support when needed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Platform Improvement</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Analyze usage patterns to improve our services</li>
                <li>Enhance AI-powered interview analysis</li>
                <li>Optimize real-time features and performance</li>
                <li>Develop new features based on user needs</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Data Security & Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Encryption</h4>
                <p className="text-gray-700 text-sm">All data is encrypted in transit and at rest using industry-standard protocols.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Authentication</h4>
                <p className="text-gray-700 text-sm">JWT-based authentication with secure password hashing using bcryptjs.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Database Security</h4>
                <p className="text-gray-700 text-sm">MongoDB Atlas cloud database with encrypted connections and access controls.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Access Controls</h4>
                <p className="text-gray-700 text-sm">Role-based access and protected API endpoints with middleware validation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Integrations */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Third-Party Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Google Services</h3>
              <p className="text-gray-700 text-sm mb-2">
                We integrate with Google services for authentication and calendar management:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 text-sm">
                <li>Google OAuth for secure authentication</li>
                <li>Google Calendar for interview scheduling</li>
                <li>Google Meet integration for video interviews</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">N8N Workflow Automation</h3>
              <p className="text-gray-700 text-sm mb-2">
                We use N8N workflows for calendar synchronization and automation:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 text-sm">
                <li>Calendar event creation and updates</li>
                <li>Meeting extension notifications</li>
                <li>Automated status updates</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Services</h3>
              <p className="text-gray-700 text-sm">
                Interview transcripts may be processed by AI services for analysis and insights, with appropriate data protection measures in place.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Data Retention & Deletion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              We retain your information only as long as necessary to provide our services and comply with legal obligations:
            </p>
            
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Account data is retained while your account is active</li>
              <li>Candidate data is retained according to your organization's policies</li>
              <li>Interview transcripts are retained for analysis and improvement purposes</li>
              <li>You may request deletion of your data by contacting us</li>
              <li>Some data may be retained for legal compliance requirements</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Your Rights & Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">You have the following rights regarding your personal information:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Access & Portability</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 text-sm">
                  <li>Request copies of your personal data</li>
                  <li>Export your candidate and interview data</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Correction & Deletion</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 text-sm">
                  <li>Update or correct your information</li>
                  <li>Request deletion of your account and data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">alizain@ideofuzion.com</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              We will respond to your inquiry within 30 days.
            </p>
          </CardContent>
        </Card>

        {/* Policy Updates */}
        <Card className="mb-8 backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by:
            </p>
            
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the "Last updated" date at the top of this policy</li>
              <li>Sending you an email notification for significant changes</li>
            </ul>
            
            <p className="text-gray-700 leading-relaxed">
              Your continued use of our service after any changes indicates your acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>
            This Privacy Policy is effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} and applies to all users of the Hire Ninja platform.
          </p>
        </div>
      </div>
    </div>
  );
}
