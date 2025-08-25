import axios from 'axios';
import { storage } from './storage.js';
import type { AccessInfo } from '../shared/schema.js';
import fs from 'fs';
import path from 'path';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

// Type definitions for workflow templates
interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters?: any;
  credentials?: any;
  disabled?: boolean;
  notesInFlow?: boolean;
  notes?: string;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  onError?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkflowTemplate {
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, any>;
  settings?: any;
  staticData?: any;
}

interface WorkflowConfigs {
  [key: string]: {
    id: string;
    name: string;
    active: boolean;
    nodes: WorkflowNode[];
    connections: Record<string, any>;
    settings: any;
    staticData: any;
  };
}

// Load actual workflow configurations from the fetched data
let WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {};

try {
  const configPath = path.join(process.cwd(), 'workflow-configs.json');
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    const configs: WorkflowConfigs = JSON.parse(configData);
    
    // Transform the fetched configurations into templates
    Object.keys(configs).forEach(workflowName => {
      const config = configs[workflowName];
      WORKFLOW_TEMPLATES[workflowName] = {
        name: config.name,
        nodes: config.nodes,
        connections: config.connections,
        settings: config.settings,
        staticData: config.staticData || {}
      };
    });
    
    console.log(`✅ [WORKFLOW] Loaded ${Object.keys(WORKFLOW_TEMPLATES).length} workflow templates from config file`);
    console.log(`📊 [WORKFLOW] Template details:`);
    Object.keys(WORKFLOW_TEMPLATES).forEach(name => {
      const template = WORKFLOW_TEMPLATES[name];
      console.log(`   - ${name}: ${template.nodes.length} nodes, ${Object.keys(template.connections).length} connections`);
    });
  } else {
    console.log(`⚠️ [WORKFLOW] workflow-configs.json not found, using fallback templates`);
    // Fallback to basic templates if config file doesn't exist
    WORKFLOW_TEMPLATES = getFallbackTemplates();
  }
} catch (error) {
  console.error(`❌ [WORKFLOW] Error loading workflow configs:`, error);
  WORKFLOW_TEMPLATES = getFallbackTemplates();
}

function getFallbackTemplates(): Record<string, WorkflowTemplate> {
  return {
    "Meeting Bot & Analysis": {
      name: "Meeting Bot & Analysis",
      nodes: [
        {
          id: "webhook-trigger",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [0, 0],
          parameters: {
            httpMethod: "POST",
            path: "meeting-analysis",
            options: {}
          }
        }
      ],
      connections: {
        "Webhook": {
          main: [[{ node: "Webhook", type: "main", index: 0 }]]
        }
      },
      settings: {
        executionOrder: "v1"
      }
    },
    "Busy Slots Working": {
      name: "Busy Slots Working",
      nodes: [
        {
          id: "webhook-trigger",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [0, 0],
          parameters: {
            httpMethod: "POST",
            path: "busy-slots",
            options: {}
          }
        }
      ],
      connections: {
        "Webhook": {
          main: [[{ node: "Webhook", type: "main", index: 0 }]]
        }
      },
      settings: {
        executionOrder: "v1"
      }
    },
    "Extending Meeting Time": {
      name: "Extending Meeting Time",
      nodes: [
        {
          id: "webhook-trigger",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [0, 0],
          parameters: {
            httpMethod: "POST",
            path: "extend-meeting",
            options: {}
          }
        }
      ],
      connections: {
        "Webhook": {
          main: [[{ node: "Webhook", type: "main", index: 0 }]]
        }
      },
      settings: {
        executionOrder: "v1"
      }
    },
    "Cv Processing Workflow": {
      name: "Cv Processing Workflow",
      nodes: [
        {
          id: "webhook-trigger",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [0, 0],
          parameters: {
            httpMethod: "POST",
            path: "cv-processing",
            options: {}
          }
        }
      ],
      connections: {
        "Webhook": {
          main: [[{ node: "Webhook", type: "main", index: 0 }]]
        }
      },
      settings: {
        executionOrder: "v1"
      }
    }
  };
}

/**
 * Creates workflows for a new user
 */
export async function createUserWorkflows(userId: string, userEmail: string): Promise<any[]> {
  console.log(`🚀 [WORKFLOW] Creating workflows for user: ${userEmail}`);
  
  try {
    // Check if user already has workflows
    const existingWorkflows = await storage.getUserWorkflows(userId);
    if (existingWorkflows && existingWorkflows.workflows.length > 0) {
      console.log(`✅ [WORKFLOW] User ${userEmail} already has ${existingWorkflows.workflows.length} workflows`);
      return existingWorkflows.workflows.map(w => ({
        name: w.name,
        id: w.n8nId,
        active: w.active
      }));
    }

    // Get user's access info for credentials
    const accessInfo = await storage.getAccessInfo(userId);
    if (!accessInfo) {
      console.log(`⚠️ [WORKFLOW] No access info found for user ${userEmail}, creating workflows without credentials`);
    }

    const createdWorkflows = [];
    
    // Create each workflow template
    for (const [workflowName, template] of Object.entries(WORKFLOW_TEMPLATES)) {
      try {
        console.log(`🔧 [WORKFLOW] Creating EXACT replica of ${workflowName} for ${userEmail}`);
        console.log(`📊 [WORKFLOW] Template has ${template.nodes.length} nodes and ${Object.keys(template.connections).length} connections`);
        
        // Create EXACT replica with user customization
        const exactReplica = {
          name: `${workflowName} - ${userEmail}`,
          nodes: template.nodes.map((node: WorkflowNode) => ({
            ...node,
            id: `${node.id}-${userId}`, // Make node IDs unique per user
            // Add credentials if available
            credentials: accessInfo ? getCredentialsForNode(node.type, accessInfo) : undefined
          })),
          connections: template.connections,
          settings: template.settings,
          staticData: template.staticData || {}
        };

        console.log(`📊 [WORKFLOW] Replica will have ${exactReplica.nodes.length} nodes`);

        const response = await axios.post(
          `${N8N_BASE_URL}/workflows`,
          exactReplica,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            }
          }
        );

        console.log(`✅ [WORKFLOW] EXACT replica of ${workflowName} created successfully for ${userEmail}`);
        console.log(`📄 [WORKFLOW] Workflow ID: ${response.data.id}`);
        console.log(`📊 [WORKFLOW] Created nodes: ${response.data.nodes.length}`);
        console.log(`🔗 [WORKFLOW] Created connections: ${Object.keys(response.data.connections).length}`);

        // Track the workflow in our database
        await storage.addWorkflowToUser(userId, workflowName, response.data.id);
        
        createdWorkflows.push({
          name: workflowName,
          id: response.data.id,
          active: response.data.active,
          nodes: response.data.nodes.length,
          connections: Object.keys(response.data.connections).length
        });

      } catch (error: any) {
        console.error(`❌ [WORKFLOW] Failed to create EXACT replica of ${workflowName} for ${userEmail}:`, error.message);
        
        if (axios.isAxiosError(error)) {
          console.error(`🚨 [WORKFLOW] API Error Details for ${workflowName}:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        
        // Continue with other workflows even if one fails
        console.log(`⚠️ [WORKFLOW] Continuing with other workflows despite ${workflowName} failure`);
      }
    }
    
    console.log(`🎉 [WORKFLOW] Created ${createdWorkflows.length} EXACT workflow replicas for user ${userEmail}`);
    console.log(`📋 [WORKFLOW] Created workflows:`, createdWorkflows);
    
    return createdWorkflows;

  } catch (error: any) {
    console.error(`❌ [WORKFLOW] Failed to create workflows for ${userEmail}:`, error.message);
    return [];
  }
}

/**
 * Gets appropriate credentials for a node type
 */
function getCredentialsForNode(nodeType: string, accessInfo: AccessInfo): any {
  switch (nodeType) {
    case "n8n-nodes-base.gmail":
      return {
        gmailOAuth2: {
          id: `gmail-${accessInfo.userId}`,
          name: `Gmail - ${accessInfo.email}`
        }
      };
    case "n8n-nodes-base.googleCalendar":
      return {
        googleCalendarOAuth2Api: {
          id: `calendar-${accessInfo.userId}`,
          name: `Google Calendar - ${accessInfo.email}`
        }
      };
    default:
      return undefined;
  }
}

/**
 * Ensures user has workflows (creates if missing)
 */
export async function ensureUserWorkflows(userId: string, userEmail: string): Promise<any[]> {
  console.log(`🔍 [WORKFLOW] Ensuring workflows exist for user: ${userEmail}`);
  
  try {
    const existingWorkflows = await storage.getUserWorkflows(userId);
    
    if (existingWorkflows && existingWorkflows.workflows.length > 0) {
      console.log(`✅ [WORKFLOW] User ${userEmail} already has workflows`);
      return existingWorkflows.workflows.map(w => ({
        name: w.name,
        id: w.n8nId,
        active: w.active
      }));
    } else {
      console.log(`🆕 [WORKFLOW] User ${userEmail} needs workflows, creating EXACT replicas`);
      return await createUserWorkflows(userId, userEmail);
    }
  } catch (error: any) {
    console.error(`❌ [WORKFLOW] Error ensuring workflows for ${userEmail}:`, error.message);
    return [];
  }
}

/**
 * Gets user's workflows
 */
export async function getUserWorkflows(userId: string): Promise<any[]> {
  try {
    const userWorkflows = await storage.getUserWorkflows(userId);
    if (!userWorkflows) {
      return [];
    }
    
    return userWorkflows.workflows.map(w => ({
      name: w.name,
      id: w.n8nId,
      active: w.active,
      createdAt: w.createdAt
    }));
  } catch (error: any) {
    console.error(`❌ [WORKFLOW] Error getting workflows for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Updates workflow status
 */
export async function updateWorkflowStatus(userId: string, workflowName: string, active: boolean): Promise<boolean> {
  try {
    const userWorkflows = await storage.getUserWorkflows(userId);
    if (!userWorkflows) {
      console.error(`❌ [WORKFLOW] No workflows found for user ${userId}`);
      return false;
    }

    const workflow = userWorkflows.workflows.find(w => w.name === workflowName);
    if (!workflow) {
      console.error(`❌ [WORKFLOW] Workflow ${workflowName} not found for user ${userId}`);
      return false;
    }

    // Update in n8n
    await axios.patch(
      `${N8N_BASE_URL}/workflows/${workflow.n8nId}`,
      { active },
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    // Update in our database
    await storage.updateWorkflowStatus(userId, workflowName, active);
    
    console.log(`✅ [WORKFLOW] Updated ${workflowName} status to ${active} for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [WORKFLOW] Error updating workflow status:`, error.message);
    return false;
  }
}
