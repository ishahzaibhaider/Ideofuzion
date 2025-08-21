import axios from 'axios';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NjA5MzQ2fQ.s1lzbCR_r4we_WjWIB8AZ1csI93PEpC4BCE--Ulwgxs";
const N8N_BASE_URL = "http://35.209.122.222:5678/api/v1";

interface CreateCredentialData {
  name: string;
  type: string;
  data: Record<string, any>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Creates an n8n credential for a new user
 * This can be customized based on what type of credential you want to create
 * Currently creating a generic HTTP credential as an example
 */
export async function createN8nCredential(user: User): Promise<any> {
  console.log(`🚀 [N8N] Starting credential creation for user: ${user.email}`);
  
  try {
    const credentialData: CreateCredentialData = {
      name: `${user.name} - User Credential`,
      type: "httpBasicAuth", // You can change this to whatever credential type you need
      data: {
        user: user.email,
        password: "default_password", // You might want to generate this or use a different approach
        // Add other credential fields based on your n8n credential type requirements
      }
    };

    console.log(`🔧 [N8N] Sending credential data:`, JSON.stringify(credentialData, null, 2));
    console.log(`🌐 [N8N] API Endpoint: ${N8N_BASE_URL}/credentials`);

    const response = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    console.log(`✅ [N8N] Credential created successfully for user ${user.email}:`);
    console.log(`📄 [N8N] Response:`, JSON.stringify(response.data, null, 2));
    return response.data;

  } catch (error: any) {
    console.error(`❌ [N8N] Failed to create n8n credential for ${user.email}:`, error.message);
    
    if (axios.isAxiosError(error)) {
      console.error(`🚨 [N8N] API Error Details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    // Don't throw the error - we don't want user registration to fail if n8n credential creation fails
    // Instead, log the error and continue
    console.log(`⚠️ [N8N] User registration will continue despite n8n credential creation failure`);
    return null;
  }
}

/**
 * Get available credential schemas from n8n
 * Useful for understanding what credential types are available
 */
export async function getCredentialSchema(credentialType: string): Promise<any> {
  try {
    const response = await axios.get(
      `${N8N_BASE_URL}/credentials/schema/${credentialType}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'accept': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`Failed to get credential schema for ${credentialType}:`, error);
    return null;
  }
}

/**
 * Alternative credential creation functions for different use cases
 * You can uncomment and modify these based on your specific needs
 */

// Example: Creating a database credential
export async function createDatabaseCredential(user: User): Promise<any> {
  try {
    const credentialData: CreateCredentialData = {
      name: `${user.name} - Database Access`,
      type: "postgres", // or "mysql", "mongodb", etc.
      data: {
        host: "your-db-host",
        database: `user_${user.id}`,
        user: user.email,
        password: "generated_password", // Generate a secure password
        port: 5432,
        ssl: false
      }
    };

    const response = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to create database credential:', error);
    return null;
  }
}

// Example: Creating an API credential
export async function createAPICredential(user: User, apiKey: string): Promise<any> {
  try {
    const credentialData: CreateCredentialData = {
      name: `${user.name} - API Access`,
      type: "httpHeaderAuth",
      data: {
        name: "Authorization",
        value: `Bearer ${apiKey}`
      }
    };

    const response = await axios.post(
      `${N8N_BASE_URL}/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to create API credential:', error);
    return null;
  }
}
