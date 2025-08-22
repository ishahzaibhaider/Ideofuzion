// Fixed version of createN8nCredentialsFromAccessInfo function
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
            // THIS IS THE KEY FIX: Include the OAuth token data
            oauthTokenData: {
              access_token: freshToken.accessToken,
              refresh_token: accessInfo.refreshToken,
              scope: accessInfo.scope,
              token_type: accessInfo.tokenType || 'Bearer',
              expires_in: Math.floor((freshToken.expiresAt.getTime() - Date.now()) / 1000)
            }
          }
        };

        console.log(`🔧 [N8N] Sending ${serviceConfig.name} credential data with token`);

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

// Also fix the createMultipleGoogleServiceCredentials function
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
            // FIXED: Include the OAuth token data
            oauthTokenData: {
              access_token: freshAccessToken,
              refresh_token: user.refreshToken,
              scope: user.scope || serviceConfig.scope,
              token_type: 'Bearer',
              expires_in: Math.floor((freshExpiresAt.getTime() - Date.now()) / 1000)
            }
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