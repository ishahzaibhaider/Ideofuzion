import axios from 'axios';
import { storage } from './storage.js';
import type { AccessInfo } from '../shared/schema.js';

const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjEzYzFlYS04M2I1LTRhMzQtYjE2NC0zNzllZDFjNzNmZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzc5OTc3LCJleHAiOjE3NTgzNDA4MDB9.mJsvf7FfTtxsNeJ5wvzunEQziQHdrWa607cqZZfVXQ4";
const N8N_BASE_URL = "https://n8n.hireninja.site/api/v1";

interface CreateCredentialData {
  name: string;
  type: string;
  data: Record<string, any>;
}

interface User {
  id: string;
  name: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Refreshes a Google OAuth access token using the refresh token
 */
async function refreshGoogleToken(refreshToken: string, clientId: string, clientSecret: string): Promise<TokenRefreshResponse> {
  try {
    console.log(`🔄 [N8N] Refreshing Google OAuth token...`);
    
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    console.log(`✅ [N8N] Token refreshed successfully`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ [N8N] Failed to refresh token:`, error.message);
    throw error;
  }
}

/**
 * Gets fresh access token for a user, refreshing if necessary
 */
async function getFreshAccessToken(accessInfo: AccessInfo): Promise<{ accessToken: string; expiresAt: Date }> {
  try {
    // Check if current token is expired or will expire soon (within 5 minutes)
    const now = new Date();
    const expiresAt = new Date(accessInfo.expiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiresAt > fiveMinutesFromNow) {
      console.log(`✅ [N8N] Current token is still valid, expires at: ${expiresAt.toISOString()}`);
      return {
        accessToken: accessInfo.accessToken,
        expiresAt: expiresAt
      };
    }
    
    console.log(`🔄 [N8N] Token expired or expiring soon, refreshing...`);
    console.log(`📅 [N8N] Current time: ${now.toISOString()}`);
    console.log(`📅 [N8N] Token expires at: ${expiresAt.toISOString()}`);
    
    // Refresh the token
    const refreshResponse = await refreshGoogleToken(
      accessInfo.refreshToken,
      accessInfo.clientId,
      accessInfo.clientSecret
    );
    
    // Calculate new expiry time
    const newExpiresAt = new Date(now.getTime() + (refreshResponse.expires_in * 1000));
    
    // Update the access info in the database with the new token
    await storage.updateAccessInfo(accessInfo.userId, {
      accessToken: refreshResponse.access_token,
      expiresAt: newExpiresAt,
      tokenType: refreshResponse.token_type,
      scope: refreshResponse.scope
    });
    
    console.log(`✅ [N8N] Token refreshed and stored in database`);
    console.log(`📅 [N8N] New token expires at: ${newExpiresAt.toISOString()}`);
    
    return {
      accessToken: refreshResponse.access_token,
      expiresAt: newExpiresAt
    };
    
  } catch (error: any) {
    console.error(`❌ [N8N] Failed to get fresh access token:`, error.message);
    throw error;
  }
}

// Google service configurations with their specific scopes and credential types
const GOOGLE_SERVICES = {
  calendar: {
    type: "googleCalendarOAuth2Api",
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    name: "Google Calendar"
  },
  gmail: {
    type: "gmailOAuth2",
    scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send",
    name: "Gmail"
  },
  contacts: {
    type: "googleContactsOAuth2Api",
    scope: "https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/contacts.readonly",
    name: "Google Contacts"
  },
  drive: {
    type: "googleDriveOAuth2Api",
    scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file",
    name: "Google Drive"
  },
  sheets: {
    type: "googleSheetsOAuth2Api",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly",
    name: "Google Sheets"
  },
  docs: {
    type: "googleDocsOAuth2Api",
    scope: "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/documents.readonly",
    name: "Google Docs"
  }
};

/**
 * Creates n8n credentials from access_info data stored in the database
 * This function is called when new Google OAuth tokens are stored in the access_info collection
 */
export async function createN8nCredentialsFromAccessInfo(accessInfo: AccessInfo): Promise<any[]> {
  console.log(`🚀 [N8N] Creating credentials from access_info for user: ${accessInfo.email}`);
  
  try {
    // Get user information
    const user = await storage.getUser(accessInfo.userId);
    if (!user) {
      console.error(`❌ [N8N] User not found for access_info: ${accessInfo.userId}`);
      return [];
    }

    // Get fresh access token before creating credentials
    console.log(`🔍 [N8N] Getting fresh access token for ${accessInfo.email}...`);
    const freshToken = await getFreshAccessToken(accessInfo);
    
    const createdCredentials = [];
    
    // Create credentials for each Google service that matches the user's scope
    for (const [serviceKey, serviceConfig] of Object.entries(GOOGLE_SERVICES)) {
      try {
        // Check if the user's scope includes the required scopes for this service
        const hasRequiredScope = serviceConfig.scope.split(' ').every(requiredScope => 
          accessInfo.scope.includes(requiredScope)
        );
        
        if (!hasRequiredScope) {
          console.log(`⚠️ [N8N] User ${accessInfo.email} doesn't have required scope for ${serviceConfig.name}`);
          continue;
        }

        console.log(`🔧 [N8N] Creating ${serviceConfig.name} credential for ${accessInfo.email}`);
        
        const credentialData: CreateCredentialData = {
          name: `${serviceConfig.name} - ${accessInfo.email}`,
          type: serviceConfig.type,
          data: {
            clientId: accessInfo.clientId,
            clientSecret: accessInfo.clientSecret,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: "{}",
            oauthTokenData: JSON.stringify({
              accessToken: freshToken.accessToken,
              refreshToken: accessInfo.refreshToken,
              expiresAt: freshToken.expiresAt.toISOString(),
              expiresIn: Math.floor((freshToken.expiresAt.getTime() - Date.now()) / 1000),
              tokenType: accessInfo.tokenType,
              scope: serviceConfig.scope
            })
          }
        };

        console.log(`🔧 [N8N] Sending ${serviceConfig.name} credential data:`, JSON.stringify({
          ...credentialData,
          data: {
            ...credentialData.data,
            oauthTokenData: {
              ...credentialData.data.oauthTokenData,
              accessToken: '[REDACTED]',
              refreshToken: '[REDACTED]'
            }
          }
        }, null, 2));
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

        console.log(`✅ [N8N] ${serviceConfig.name} credential created successfully for user ${accessInfo.email}:`);
        console.log(`📄 [N8N] Credential ID: ${response.data.id}`);
        console.log(`📄 [N8N] Credential name: ${response.data.name}`);
        
        createdCredentials.push({
          service: serviceKey,
          credentialId: response.data.id,
          credentialName: response.data.name,
          type: serviceConfig.type
        });

      } catch (error: any) {
        console.error(`❌ [N8N] Failed to create ${serviceConfig.name} credential for ${accessInfo.email}:`, error.message);
        
        if (axios.isAxiosError(error)) {
          console.error(`🚨 [N8N] API Error Details for ${serviceConfig.name}:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        
        // Continue with other services even if one fails
        console.log(`⚠️ [N8N] Continuing with other services despite ${serviceConfig.name} failure`);
      }
    }
    
    console.log(`🎉 [N8N] Created ${createdCredentials.length} Google service credentials for user ${accessInfo.email}`);
    console.log(`📋 [N8N] Created credentials:`, createdCredentials);
    
    return createdCredentials;

  } catch (error: any) {
    console.error(`❌ [N8N] Failed to create credentials from access_info for ${accessInfo.email}:`, error.message);
    return [];
  }
}

/**
 * Creates multiple Google service credentials for a new user
 * This creates credentials for Calendar, Gmail, Contacts, Drive, Sheets, and Docs
 */
export async function createN8nCredential(user: User): Promise<any> {
  console.log(`🚀 [N8N] Starting credential creation for user: ${user.email}`);
  
  try {
    // If we have Google OAuth tokens, create multiple Google service credentials
    if (user.accessToken && user.refreshToken) {
      console.log(`🔑 [N8N] Creating Google service credentials for ${user.email}`);
      return await createMultipleGoogleServiceCredentials(user);
    }
    
    // Fallback to basic HTTP auth credential for regular signups
    console.log(`🔐 [N8N] Creating basic HTTP auth credential for ${user.email}`);
    const credentialData: CreateCredentialData = {
      name: `${user.name} - Basic Auth`,
      type: "httpBasicAuth",
      data: {
        user: user.email,
        password: "default_password", // You might want to generate this or use a different approach
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
 * Creates multiple Google service credentials for a user
 * Based on the examples provided, this creates credentials for Calendar, Gmail, Contacts, Drive, Sheets, and Docs
 */
export async function createMultipleGoogleServiceCredentials(user: User): Promise<any[]> {
  console.log(`🚀 [N8N] Creating multiple Google service credentials for user: ${user.email}`);
  
  try {
    // Get Google OAuth credentials from environment
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!googleClientId || !googleClientSecret) {
      console.error('❌ [N8N] Missing Google OAuth credentials in environment variables');
      return [];
    }
    
    // Get fresh access token if we have refresh token
    let freshAccessToken = user.accessToken;
    let freshExpiresAt = new Date(Date.now() + (3600 * 1000));
    
    if (user.refreshToken) {
      try {
        console.log(`🔍 [N8N] Getting fresh access token for ${user.email}...`);
        const refreshResponse = await refreshGoogleToken(user.refreshToken, googleClientId, googleClientSecret);
        freshAccessToken = refreshResponse.access_token;
        freshExpiresAt = new Date(Date.now() + (refreshResponse.expires_in * 1000));
        console.log(`✅ [N8N] Token refreshed for ${user.email}`);
      } catch (error) {
        console.warn(`⚠️ [N8N] Failed to refresh token for ${user.email}, using existing token`);
      }
    }
    
    const createdCredentials = [];
    
    // Create credentials for each Google service
    for (const [serviceKey, serviceConfig] of Object.entries(GOOGLE_SERVICES)) {
      try {
        console.log(`🔧 [N8N] Creating ${serviceConfig.name} credential for ${user.email}`);
        
        const credentialData: CreateCredentialData = {
          name: `${serviceConfig.name} - ${user.email}`,
          type: serviceConfig.type,
          data: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: "{}",
            oauthTokenData: JSON.stringify({
              accessToken: freshAccessToken,
              refreshToken: user.refreshToken,
              expiresAt: freshExpiresAt.toISOString(),
              expiresIn: Math.floor((freshExpiresAt.getTime() - Date.now()) / 1000),
              tokenType: "Bearer",
              scope: serviceConfig.scope
            })
          }
        };

        console.log(`🔧 [N8N] Sending ${serviceConfig.name} credential data:`, JSON.stringify({
          ...credentialData,
          data: {
            ...credentialData.data,
            oauthTokenData: {
              ...credentialData.data.oauthTokenData,
              accessToken: '[REDACTED]',
              refreshToken: '[REDACTED]'
            }
          }
        }, null, 2));
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

        console.log(`✅ [N8N] ${serviceConfig.name} credential created successfully for user ${user.email}:`);
        console.log(`📄 [N8N] Credential ID: ${response.data.id}`);
        console.log(`📄 [N8N] Credential name: ${response.data.name}`);
        
        createdCredentials.push({
          service: serviceKey,
          credentialId: response.data.id,
          credentialName: response.data.name,
          type: serviceConfig.type
        });

      } catch (error: any) {
        console.error(`❌ [N8N] Failed to create ${serviceConfig.name} credential for ${user.email}:`, error.message);
        
        if (axios.isAxiosError(error)) {
          console.error(`🚨 [N8N] API Error Details for ${serviceConfig.name}:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        
        // Continue with other services even if one fails
        console.log(`⚠️ [N8N] Continuing with other services despite ${serviceConfig.name} failure`);
      }
    }
    
    console.log(`🎉 [N8N] Created ${createdCredentials.length} Google service credentials for user ${user.email}`);
    console.log(`📋 [N8N] Created credentials:`, createdCredentials);
    
    return createdCredentials;

  } catch (error: any) {
    console.error(`❌ [N8N] Failed to create Google service credentials for ${user.email}:`, error.message);
    return [];
  }
}

/**
 * Creates a specific Google service credential (for individual service creation)
 */
export async function createGoogleServiceCredential(user: User, serviceKey: string): Promise<any> {
  console.log(`🚀 [N8N] Creating ${serviceKey} credential for user: ${user.email}`);
  
  try {
    const serviceConfig = GOOGLE_SERVICES[serviceKey as keyof typeof GOOGLE_SERVICES];
    if (!serviceConfig) {
      console.error(`❌ [N8N] Unknown service: ${serviceKey}`);
      return null;
    }
    
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!googleClientId || !googleClientSecret) {
      console.error('❌ [N8N] Missing Google OAuth credentials in environment variables');
      return null;
    }
    
    // Get fresh access token if we have refresh token
    let freshAccessToken = user.accessToken;
    let freshExpiresAt = new Date(Date.now() + (3600 * 1000));
    
    if (user.refreshToken) {
      try {
        console.log(`🔍 [N8N] Getting fresh access token for ${user.email}...`);
        const refreshResponse = await refreshGoogleToken(user.refreshToken, googleClientId, googleClientSecret);
        freshAccessToken = refreshResponse.access_token;
        freshExpiresAt = new Date(Date.now() + (refreshResponse.expires_in * 1000));
        console.log(`✅ [N8N] Token refreshed for ${user.email}`);
      } catch (error) {
        console.warn(`⚠️ [N8N] Failed to refresh token for ${user.email}, using existing token`);
      }
    }
    
    const credentialData: CreateCredentialData = {
      name: `${serviceConfig.name} - ${user.email}`,
      type: serviceConfig.type,
      data: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: "{}",
        oauthTokenData: JSON.stringify({
          accessToken: freshAccessToken,
          refreshToken: user.refreshToken,
          expiresAt: freshExpiresAt.toISOString(),
          expiresIn: Math.floor((freshExpiresAt.getTime() - Date.now()) / 1000),
          tokenType: "Bearer",
          scope: serviceConfig.scope
        })
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

    console.log(`✅ [N8N] ${serviceConfig.name} credential created successfully for user ${user.email}`);
    return response.data;

  } catch (error: any) {
    console.error(`❌ [N8N] Failed to create ${serviceKey} credential for ${user.email}:`, error.message);
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
 * Get all available Google service configurations
 */
export function getAvailableGoogleServices(): Record<string, any> {
  return GOOGLE_SERVICES;
}

/**
 * Manually refresh tokens and recreate n8n credentials for a user
 * This is useful for fixing "unable to sign without access token" errors
 */
export async function refreshTokensAndRecreateCredentials(userId: string): Promise<any[]> {
  console.log(`🔄 [N8N] Manually refreshing tokens and recreating credentials for user: ${userId}`);
  
  try {
    // Get the user's access info
    const accessInfo = await storage.getAccessInfo(userId);
    if (!accessInfo) {
      console.error(`❌ [N8N] No access info found for user: ${userId}`);
      return [];
    }
    
    console.log(`📝 [N8N] Found access info for user: ${accessInfo.email}`);
    
    // Force refresh the token (even if it's not expired)
    console.log(`🔄 [N8N] Force refreshing token for ${accessInfo.email}...`);
    const refreshResponse = await refreshGoogleToken(
      accessInfo.refreshToken,
      accessInfo.clientId,
      accessInfo.clientSecret
    );
    
    // Update the access info in the database
    const newExpiresAt = new Date(Date.now() + (refreshResponse.expires_in * 1000));
    await storage.updateAccessInfo(userId, {
      accessToken: refreshResponse.access_token,
      expiresAt: newExpiresAt,
      tokenType: refreshResponse.token_type,
      scope: refreshResponse.scope
    });
    
    console.log(`✅ [N8N] Token refreshed and stored in database for ${accessInfo.email}`);
    
    // Create fresh credentials with the new token
    const updatedAccessInfo = await storage.getAccessInfo(userId);
    if (!updatedAccessInfo) {
      console.error(`❌ [N8N] Failed to get updated access info for user: ${userId}`);
      return [];
    }
    
    console.log(`🔧 [N8N] Creating fresh credentials for ${accessInfo.email}...`);
    const credentials = await createN8nCredentialsFromAccessInfo(updatedAccessInfo);
    
    console.log(`✅ [N8N] Successfully refreshed tokens and recreated ${credentials.length} credentials for ${accessInfo.email}`);
    return credentials;
    
  } catch (error: any) {
    console.error(`❌ [N8N] Failed to refresh tokens and recreate credentials for user ${userId}:`, error.message);
    return [];
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
