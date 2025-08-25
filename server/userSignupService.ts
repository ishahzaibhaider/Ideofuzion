import axios from 'axios';
import { storage } from './storage.js';
import type { AccessInfo } from '../shared/schema.js';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Template workflow IDs that need to be duplicated
const TEMPLATE_WORKFLOW_IDS = [
  "gshw8NOB3t8ZH1cL",
  "qLVwvsZGpIOSBNYu", 
  "w7k9ejgAD16tskZl",
  "QCxCZmYREkK0FODI"
];

interface User {
  id: string;
  name: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
}

interface CreateCredentialData {
  name: string;
  type: string;
  data: Record<string, any>;
}

interface WorkflowResponse {
  id?: string;
  name: string;
  active?: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

interface TemplateWorkflowResponse {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

interface SignupResult {
  success: boolean;
  userId: string;
  credentials: any[];
  workflows: any[];
  errors: string[];
}

/**
 * Step 1: Create User-Specific Credentials in n8n
 * Creates credentials for the user and returns the credential IDs
 */
async function createUserCredentials(user: User, accessInfo?: AccessInfo): Promise<string[]> {
  console.log(`🔑 [SIGNUP] Step 1: Creating credentials for user ${user.email}`);
  
  const credentialIds: string[] = [];
  
  try {
    // If we have access info with OAuth tokens, create Google service credentials
    if (accessInfo && accessInfo.accessToken && accessInfo.refreshToken) {
      console.log(`🔑 [SIGNUP] Creating Google service credentials for ${user.email}`);
      
      // Create credentials for different Google services
      const googleServices = [
        { type: 'googleSheetOAuth2Api', name: 'Google Sheets' },
        { type: 'googleCalendarOAuth2Api', name: 'Google Calendar' },
        { type: 'gmailOAuth2Api', name: 'Gmail' },
        { type: 'googleDriveOAuth2Api', name: 'Google Drive' }
      ];
      
      for (const service of googleServices) {
        try {
          const credentialData: CreateCredentialData = {
            name: `Creds_User_${user.id}_${service.name}`,
            type: service.type,
            data: {
              accessToken: accessInfo.accessToken,
              refreshToken: accessInfo.refreshToken,
              clientId: accessInfo.clientId,
              clientSecret: accessInfo.clientSecret,
              scope: accessInfo.scope || 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive'
            }
          };
          
          const response = await axios.post(
            `${N8N_BASE_URL}/credentials`,
            credentialData,
            {
              headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.data && response.data.id) {
            credentialIds.push(response.data.id);
            console.log(`✅ [SIGNUP] Created ${service.name} credential with ID: ${response.data.id}`);
          }
        } catch (error: any) {
          console.error(`❌ [SIGNUP] Failed to create ${service.name} credential:`, error.message);
          throw new Error(`Failed to create ${service.name} credential: ${error.message}`);
        }
      }
    } else {
      // Fallback to basic HTTP auth credential
      console.log(`🔐 [SIGNUP] Creating basic HTTP auth credential for ${user.email}`);
      
      const credentialData: CreateCredentialData = {
        name: `Creds_User_${user.id}_BasicAuth`,
        type: "httpBasicAuth",
        data: {
          user: user.email,
          password: "default_password"
        }
      };
      
      const response = await axios.post(
        `${N8N_BASE_URL}/credentials`,
        credentialData,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.id) {
        credentialIds.push(response.data.id);
        console.log(`✅ [SIGNUP] Created basic auth credential with ID: ${response.data.id}`);
      }
    }
    
    console.log(`✅ [SIGNUP] Step 1 completed: Created ${credentialIds.length} credentials`);
    return credentialIds;
    
  } catch (error: any) {
    console.error(`❌ [SIGNUP] Step 1 failed: Credential creation error:`, error.message);
    throw new Error(`Credential creation failed: ${error.message}`);
  }
}

/**
 * Step 2: Fetch the Master Template Workflow
 * Fetches a specific template workflow by ID
 */
async function fetchTemplateWorkflow(templateId: string): Promise<TemplateWorkflowResponse> {
  console.log(`📋 [SIGNUP] Step 2: Fetching template workflow ${templateId}`);
  
  try {
    const response = await axios.get(
      `${N8N_BASE_URL}/workflows/${templateId}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error(`No workflow data returned for template ${templateId}`);
    }
    
    console.log(`✅ [SIGNUP] Step 2 completed: Fetched template workflow ${templateId}`);
    return response.data;
    
  } catch (error: any) {
    console.error(`❌ [SIGNUP] Step 2 failed: Failed to fetch template workflow ${templateId}:`, error.message);
    throw new Error(`Failed to fetch template workflow ${templateId}: ${error.message}`);
  }
}

/**
 * Step 3: Programmatically Modify the Workflow JSON
 * Creates a deep copy and modifies it for the new user
 */
function modifyWorkflowForUser(
  templateWorkflow: TemplateWorkflowResponse, 
  userId: string, 
  userEmail: string, 
  credentialIds: string[]
): WorkflowResponse {
  console.log(`🔧 [SIGNUP] Step 3: Modifying workflow for user ${userEmail}`);
  
  try {
    // Create a minimal workflow structure with only the properties n8n accepts
    const newUserWorkflow: WorkflowResponse = {
      name: `Workflow for User ${userId} - ${templateWorkflow.name}`,
      nodes: JSON.parse(JSON.stringify(templateWorkflow.nodes)),
      connections: JSON.parse(JSON.stringify(templateWorkflow.connections)),
      settings: templateWorkflow.settings ? JSON.parse(JSON.stringify(templateWorkflow.settings)) : undefined,
      staticData: templateWorkflow.staticData ? JSON.parse(JSON.stringify(templateWorkflow.staticData)) : undefined
    };
    
    // Iterate through nodes and update credentials
    if (newUserWorkflow.nodes && Array.isArray(newUserWorkflow.nodes)) {
      newUserWorkflow.nodes.forEach((node: any, index: number) => {
        // Make node IDs unique per user
        node.id = `${node.id}-${userId}`;
        
        // Update credentials if they exist
        if (node.credentials && typeof node.credentials === 'object') {
          const credKeys = Object.keys(node.credentials);
          
          credKeys.forEach((credKey, credIndex) => {
            if (credentialIds[credIndex]) {
              // Update the credential ID
              node.credentials[credKey].id = credentialIds[credIndex];
              // Update the name for clarity
              node.credentials[credKey].name = `Creds_User_${userId}`;
            }
          });
        }
      });
    }
    
    console.log(`✅ [SIGNUP] Step 3 completed: Modified workflow for user ${userEmail}`);
    return newUserWorkflow;
    
  } catch (error: any) {
    console.error(`❌ [SIGNUP] Step 3 failed: Workflow modification error:`, error.message);
    throw new Error(`Workflow modification failed: ${error.message}`);
  }
}

/**
 * Step 4: Create the New Workflow in n8n
 * Creates the modified workflow in n8n
 */
async function createWorkflowInN8n(workflowData: WorkflowResponse): Promise<string> {
  console.log(`🚀 [SIGNUP] Step 4: Creating workflow in n8n`);
  
  try {
    const response = await axios.post(
      `${N8N_BASE_URL}/workflows`,
      workflowData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data || !response.data.id) {
      throw new Error('No workflow ID returned from n8n API');
    }
    
    console.log(`✅ [SIGNUP] Step 4 completed: Created workflow with ID ${response.data.id}`);
    return response.data.id;
    
  } catch (error: any) {
    console.error(`❌ [SIGNUP] Step 4 failed: Workflow creation error:`, error.message);
    
    if (axios.isAxiosError(error)) {
      console.error(`🚨 [SIGNUP] API Error Details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    
    throw new Error(`Workflow creation failed: ${error.message}`);
  }
}

/**
 * Step 5: Store the Result in the Database
 * Stores the workflow ID in the user's record
 */
async function storeWorkflowInDatabase(userId: string, workflowId: string, workflowName: string): Promise<void> {
  console.log(`💾 [SIGNUP] Step 5: Storing workflow ${workflowId} in database for user ${userId}`);
  
  try {
    await storage.addWorkflowToUser(userId, workflowName, workflowId);
    console.log(`✅ [SIGNUP] Step 5 completed: Stored workflow ${workflowId} in database`);
  } catch (error: any) {
    console.error(`❌ [SIGNUP] Step 5 failed: Database storage error:`, error.message);
    throw new Error(`Database storage failed: ${error.message}`);
  }
}

/**
 * Main function: Complete user signup process
 * Orchestrates all steps with robust error handling
 */
export async function processUserSignup(user: User, accessInfo?: AccessInfo): Promise<SignupResult> {
  console.log(`🚀 [SIGNUP] Starting complete signup process for user: ${user.email}`);
  
  const result: SignupResult = {
    success: false,
    userId: user.id,
    credentials: [],
    workflows: [],
    errors: []
  };
  
  let credentialIds: string[] = [];
  
  try {
    // Step 1: Create credentials
    try {
      credentialIds = await createUserCredentials(user, accessInfo);
      result.credentials = credentialIds.map(id => ({ id, type: 'created' }));
    } catch (error: any) {
      console.error(`❌ [SIGNUP] Credential creation failed:`, error.message);
      result.errors.push(`Credential creation failed: ${error.message}`);
      // Don't abort - continue with basic auth
      credentialIds = [];
    }
    
    // Step 2-5: Create workflows for each template
    for (const templateId of TEMPLATE_WORKFLOW_IDS) {
      try {
        console.log(`📋 [SIGNUP] Processing template workflow: ${templateId}`);
        
        // Step 2: Fetch template
        const templateWorkflow = await fetchTemplateWorkflow(templateId);
        
        // Step 3: Modify for user
        const modifiedWorkflow = modifyWorkflowForUser(templateWorkflow, user.id, user.email, credentialIds);
        
        // Step 4: Create in n8n
        const newWorkflowId = await createWorkflowInN8n(modifiedWorkflow);
        
        // Step 5: Store in database
        await storeWorkflowInDatabase(user.id, newWorkflowId, templateWorkflow.name);
        
        result.workflows.push({
          id: newWorkflowId,
          name: templateWorkflow.name,
          templateId: templateId,
          active: true
        });
        
        console.log(`✅ [SIGNUP] Successfully created workflow ${newWorkflowId} from template ${templateId}`);
        
      } catch (error: any) {
        console.error(`❌ [SIGNUP] Failed to create workflow from template ${templateId}:`, error.message);
        result.errors.push(`Workflow creation failed for template ${templateId}: ${error.message}`);
        // Continue with other workflows
      }
    }
    
    // Determine overall success
    result.success = result.workflows.length > 0;
    
    if (result.success) {
      console.log(`🎉 [SIGNUP] Signup process completed successfully for ${user.email}`);
      console.log(`📊 [SIGNUP] Created ${result.workflows.length} workflows and ${result.credentials.length} credentials`);
    } else {
      console.log(`⚠️ [SIGNUP] Signup process completed with errors for ${user.email}`);
      console.log(`📊 [SIGNUP] Errors: ${result.errors.length}`);
    }
    
    return result;
    
  } catch (error: any) {
    console.error(`❌ [SIGNUP] Critical error in signup process:`, error.message);
    result.errors.push(`Critical error: ${error.message}`);
    result.success = false;
    return result;
  }
}

/**
 * Cleanup function: Remove created resources if signup fails
 */
export async function cleanupFailedSignup(userId: string, credentialIds: string[], workflowIds: string[]): Promise<void> {
  console.log(`🧹 [SIGNUP] Cleaning up failed signup for user ${userId}`);
  
  // Delete created workflows
  for (const workflowId of workflowIds) {
    try {
      await axios.delete(`${N8N_BASE_URL}/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      console.log(`🗑️ [SIGNUP] Deleted workflow ${workflowId}`);
    } catch (error: any) {
      console.error(`❌ [SIGNUP] Failed to delete workflow ${workflowId}:`, error.message);
    }
  }
  
  // Delete created credentials
  for (const credentialId of credentialIds) {
    try {
      await axios.delete(`${N8N_BASE_URL}/credentials/${credentialId}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      console.log(`🗑️ [SIGNUP] Deleted credential ${credentialId}`);
    } catch (error: any) {
      console.error(`❌ [SIGNUP] Failed to delete credential ${credentialId}:`, error.message);
    }
  }
  
  console.log(`✅ [SIGNUP] Cleanup completed for user ${userId}`);
}
