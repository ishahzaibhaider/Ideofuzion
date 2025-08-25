import { N8nWorkflowModel, InsertN8nWorkflow, IN8nWorkflow } from '../shared/schema';
import { connectToDatabase } from './db';

interface N8nWorkflowResponse {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
  tags?: any[];
  triggerCount?: number;
  versionId?: string;
}

interface N8nWorkflowListResponse {
  data: N8nWorkflowResponse[];
}

export class N8nWorkflowService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'https://n8n.hireninja.site/api/v1';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  /**
   * Fetch all workflows from n8n instance
   */
  async fetchAllWorkflows(): Promise<N8nWorkflowResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.status} ${response.statusText}`);
      }

      const data: N8nWorkflowListResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching workflows from n8n:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific workflow by ID from n8n
   */
  async fetchWorkflowById(workflowId: string): Promise<N8nWorkflowResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch workflow: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Store workflow in database
   */
  async storeWorkflow(userId: string, workflowData: N8nWorkflowResponse): Promise<IN8nWorkflow> {
    await connectToDatabase();

    const workflowDoc: InsertN8nWorkflow = {
      n8nId: workflowData.id,
      name: workflowData.name,
      active: workflowData.active,
      workflowData: workflowData, // Store complete workflow data
      metadata: {
        version: workflowData.versionId || '1.0.0',
        tags: workflowData.tags?.map(tag => tag.name) || [],
        category: 'automation'
      },
      status: workflowData.active ? 'active' : 'inactive'
    };

    // Check if workflow already exists
    const existingWorkflow = await N8nWorkflowModel.findOne({
      userId,
      n8nId: workflowData.id
    });

    if (existingWorkflow) {
      // Update existing workflow
      const updatedWorkflow = await N8nWorkflowModel.findOneAndUpdate(
        { userId, n8nId: workflowData.id },
        {
          ...workflowDoc,
          updatedAt: new Date(),
          'metadata.updatedAt': new Date()
        },
        { new: true }
      );
      return updatedWorkflow!;
    } else {
      // Create new workflow
      const newWorkflow = new N8nWorkflowModel({
        userId,
        ...workflowDoc
      });
      return await newWorkflow.save();
    }
  }

  /**
   * Store all workflows for a user
   */
  async storeAllWorkflows(userId: string): Promise<{ stored: number; errors: string[] }> {
    try {
      const workflows = await this.fetchAllWorkflows();
      const results = { stored: 0, errors: [] as string[] };

      for (const workflow of workflows) {
        try {
          await this.storeWorkflow(userId, workflow);
          results.stored++;
        } catch (error) {
          const errorMsg = `Failed to store workflow ${workflow.name} (${workflow.id}): ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      return results;
    } catch (error) {
      console.error('Error storing all workflows:', error);
      throw error;
    }
  }

  /**
   * Get all workflows for a user from database
   */
  async getUserWorkflows(userId: string): Promise<IN8nWorkflow[]> {
    await connectToDatabase();
    return await N8nWorkflowModel.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Get a specific workflow by n8n ID for a user
   */
  async getUserWorkflow(userId: string, n8nId: string): Promise<IN8nWorkflow | null> {
    await connectToDatabase();
    return await N8nWorkflowModel.findOne({ userId, n8nId });
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(userId: string, n8nId: string, status: 'active' | 'inactive' | 'archived'): Promise<IN8nWorkflow | null> {
    await connectToDatabase();
    return await N8nWorkflowModel.findOneAndUpdate(
      { userId, n8nId },
      { 
        status,
        active: status === 'active',
        updatedAt: new Date(),
        'metadata.updatedAt': new Date()
      },
      { new: true }
    );
  }

  /**
   * Delete workflow from database
   */
  async deleteWorkflow(userId: string, n8nId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await N8nWorkflowModel.deleteOne({ userId, n8nId });
    return result.deletedCount > 0;
  }

  /**
   * Sync workflows from n8n to database for a user
   */
  async syncWorkflows(userId: string): Promise<{ synced: number; errors: string[] }> {
    try {
      const workflows = await this.fetchAllWorkflows();
      const results = { synced: 0, errors: [] as string[] };

      for (const workflow of workflows) {
        try {
          await this.storeWorkflow(userId, workflow);
          results.synced++;
        } catch (error) {
          const errorMsg = `Failed to sync workflow ${workflow.name} (${workflow.id}): ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing workflows:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics for a user
   */
  async getWorkflowStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    archived: number;
  }> {
    await connectToDatabase();
    
    const [total, active, inactive, archived] = await Promise.all([
      N8nWorkflowModel.countDocuments({ userId }),
      N8nWorkflowModel.countDocuments({ userId, status: 'active' }),
      N8nWorkflowModel.countDocuments({ userId, status: 'inactive' }),
      N8nWorkflowModel.countDocuments({ userId, status: 'archived' })
    ]);

    return { total, active, inactive, archived };
  }
}

export const n8nWorkflowService = new N8nWorkflowService();
