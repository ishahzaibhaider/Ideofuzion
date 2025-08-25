# Comprehensive User Signup Service

## Overview

This document describes the robust, multi-step backend process for user signup that automatically creates n8n credentials and duplicates specific template workflows for new users.

## Architecture

The signup process is implemented in `userSignupService.ts` and integrates with the existing authentication system in `routes.ts`. It follows a 5-step process with comprehensive error handling and cleanup capabilities.

## Workflow Templates

The service duplicates the following 4 specific workflow templates:

1. **gshw8NOB3t8ZH1cL** - Workflow template 1
2. **qLVwvsZGpIOSBNYu** - Workflow template 2  
3. **w7k9ejgAD16tskZl** - Workflow template 3
4. **QCxCZmYREkK0FODI** - Meeting Bot & Analysis workflow

## Step-by-Step Process

### Step 1: Create User-Specific Credentials in n8n

**Endpoint**: `POST /api/v1/credentials`

**Process**:
- Creates unique credential names: `Creds_User_{userId}_{ServiceName}`
- Supports both OAuth2 (Google services) and basic HTTP auth
- For OAuth users: Creates credentials for Google Sheets, Calendar, Gmail, and Drive
- For regular users: Creates basic HTTP auth credential
- Extracts and stores the credential ID for use in workflow configuration

**Error Handling**: 
- If credential creation fails, logs error but continues with basic auth
- Does not abort the entire signup process

### Step 2: Fetch the Master Template Workflow

**Endpoint**: `GET /api/v1/workflows/{templateId}`

**Process**:
- Fetches each of the 4 template workflows by ID
- Validates that the workflow data is complete
- Stores the entire workflow JSON for modification

**Error Handling**:
- If template fetch fails, logs error and skips that workflow
- Continues with other templates

### Step 3: Programmatically Modify the Workflow JSON

**Process**:
- Creates a deep copy of the template workflow
- Modifies the workflow name: `Workflow for User {userId} - {originalName}`
- Removes the original workflow ID to ensure n8n creates a new one
- Makes node IDs unique per user: `{originalNodeId}-{userId}`
- Dynamically updates credential references:
  - Finds all credential objects in nodes
  - Updates credential IDs to use the newly created user credentials
  - Updates credential names for clarity

**Key Features**:
- Handles any credential type dynamically
- Preserves all workflow structure and connections
- Ensures no ID conflicts between users

### Step 4: Create the New Workflow in n8n

**Endpoint**: `POST /api/v1/workflows`

**Process**:
- Sends the complete modified workflow JSON to n8n
- Validates that a new workflow ID is returned
- Logs detailed success/failure information

**Error Handling**:
- Logs complete API error details for debugging
- Continues with other workflows if one fails

### Step 5: Store the Result in the Database

**Process**:
- Stores the new workflow ID in the user's database record
- Links the user to their specific, active workflow in n8n
- Only stores if workflow creation was successful

**Error Handling**:
- If database storage fails, logs error but doesn't affect workflow creation
- Prevents "empty collection" problems

## Integration Points

### Regular Signup Route

**File**: `routes.ts` - `/api/auth/signup`

**Process**:
```typescript
// Create user in database
const user = await storage.createUser({...});

// Use comprehensive signup service
const signupResult = await processUserSignup({
  id: user.id,
  name: user.name,
  email: user.email
});

// Handle results and cleanup if needed
if (!signupResult.success && signupResult.workflows.length === 0) {
  await cleanupFailedSignup(user.id, credentialIds, workflowIds);
}
```

### OAuth Signup Route

**File**: `routes.ts` - `/auth/google/callback`

**Process**:
```typescript
// Store OAuth tokens in database
const accessInfo = await storage.createAccessInfo({...});

// Use comprehensive signup service with OAuth data
const signupResult = await processUserSignup({
  id: user.id,
  name: user.name,
  email: user.email,
  accessToken: user.accessToken,
  refreshToken: user.refreshToken,
  scope: user.scope
}, accessInfo);
```

## Error Handling & Cleanup

### Comprehensive Error Handling

1. **Credential Creation Failures**: Logged but don't abort signup
2. **Template Fetch Failures**: Individual workflows skipped, others continue
3. **Workflow Creation Failures**: Detailed logging, continues with other workflows
4. **Database Storage Failures**: Logged but don't affect workflow creation

### Cleanup Function

**Function**: `cleanupFailedSignup(userId, credentialIds, workflowIds)`

**Process**:
- Deletes any created workflows if signup fails completely
- Deletes any created credentials
- Prevents orphaned resources in n8n

## API Response Format

### Success Response
```typescript
{
  success: true,
  userId: "user123",
  credentials: [
    { id: "cred1", type: "created" },
    { id: "cred2", type: "created" }
  ],
  workflows: [
    {
      id: "workflow1",
      name: "Meeting Bot & Analysis",
      templateId: "QCxCZmYREkK0FODI",
      active: true
    }
  ],
  errors: []
}
```

### Partial Success Response
```typescript
{
  success: true,
  userId: "user123",
  credentials: [{ id: "cred1", type: "created" }],
  workflows: [
    {
      id: "workflow1",
      name: "Meeting Bot & Analysis",
      templateId: "QCxCZmYREkK0FODI",
      active: true
    }
  ],
  errors: [
    "Workflow creation failed for template gshw8NOB3t8ZH1cL: API error"
  ]
}
```

## Testing

### Test Script

**File**: `test-comprehensive-signup.js`

**Tests**:
1. **Template Workflow Verification**: Ensures all 4 template workflows exist
2. **Credential Creation**: Tests basic HTTP auth credential creation
3. **Workflow Duplication**: Tests complete workflow duplication process
4. **Cleanup**: Automatically cleans up test resources

**Run**: `node test-comprehensive-signup.js`

### Manual Testing

1. **Regular Signup**: Test user registration without OAuth
2. **OAuth Signup**: Test Google OAuth signup flow
3. **Error Scenarios**: Test with invalid template IDs, network failures
4. **Cleanup Verification**: Verify orphaned resources are cleaned up

## Configuration

### Environment Variables

```bash
N8N_API_KEY=your_n8n_api_key
N8N_BASE_URL=https://n8n.hireninja.site/api/v1
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
```

### Template Workflow IDs

The service is configured to duplicate these specific workflows:

```typescript
const TEMPLATE_WORKFLOW_IDS = [
  "gshw8NOB3t8ZH1cL",
  "qLVwvsZGpIOSBNYu", 
  "w7k9ejgAD16tskZl",
  "QCxCZmYREkK0FODI"
];
```

## Monitoring & Logging

### Log Format

All operations use structured logging with emojis for easy identification:

- 🚀 Process start
- 🔑 Credential operations
- 📋 Workflow operations
- 🔧 Workflow modification
- 💾 Database operations
- ✅ Success indicators
- ❌ Error indicators
- 🧹 Cleanup operations

### Key Metrics to Monitor

1. **Success Rate**: Percentage of successful signups
2. **Credential Creation**: Success rate of credential creation
3. **Workflow Creation**: Success rate of workflow duplication
4. **Error Patterns**: Common failure points
5. **Cleanup Efficiency**: Orphaned resource cleanup

## Troubleshooting

### Common Issues

1. **Template Workflow Not Found**
   - Verify template IDs are correct
   - Check n8n API connectivity
   - Ensure API key has read permissions

2. **Credential Creation Fails**
   - Check API key permissions
   - Verify credential type names
   - Check OAuth token validity

3. **Workflow Creation Fails**
   - Check workflow JSON structure
   - Verify credential references
   - Check n8n API limits

4. **Database Storage Fails**
   - Check database connectivity
   - Verify user record exists
   - Check storage permissions

### Debug Commands

```bash
# Test template workflows
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://n8n.hireninja.site/api/v1/workflows/QCxCZmYREkK0FODI"

# Test credential creation
curl -X POST -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","type":"httpBasicAuth","data":{"user":"test","password":"test"}}' \
  "https://n8n.hireninja.site/api/v1/credentials"

# Run test suite
node test-comprehensive-signup.js
```

## Future Enhancements

1. **Retry Logic**: Implement exponential backoff for failed operations
2. **Batch Processing**: Process multiple workflows in parallel
3. **Template Versioning**: Support for different template versions
4. **Custom Workflow Types**: Allow users to select specific workflows
5. **Monitoring Dashboard**: Real-time signup process monitoring
6. **Rollback Capability**: Automatic rollback on partial failures
