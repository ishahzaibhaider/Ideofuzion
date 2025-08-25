# n8n Workflow Integration for User Signup

This document explains the implementation of automatic workflow creation for new users in the Ideofuzion platform.

## Overview

When a new user signs up (either through regular registration or Google OAuth), the system automatically creates 4 essential workflows in n8n:

1. **CV Processing Workflow** - Handles CV/resume processing
2. **Meeting Bot & Analysis** - Manages meeting analysis and bot interactions
3. **Busy Slots Working** - Handles busy slot management
4. **Extending Meeting Time** - Manages meeting time extensions

## Key Features

### ✅ Duplicate Prevention
- Workflows are tracked in a `userWorkflows` collection in MongoDB
- Each user can only have one instance of each workflow type
- Subsequent logins reuse existing workflows instead of creating duplicates

### ✅ Credential Integration
- For Google OAuth users, workflows are automatically configured with their Google credentials
- Credentials are applied to relevant nodes (Gmail, Google Calendar, etc.)
- Users don't need to manually configure credentials in n8n

### ✅ User Isolation
- Each user gets their own personalized workflows
- Workflow names include the user's email for easy identification
- All workflows are isolated per user

## Implementation Details

### Database Schema

```typescript
// MongoDB User Workflows Schema
interface IUserWorkflows {
  _id: string;
  userId: string;
  workflows: {
    name: string;
    n8nId: string;
    createdAt: Date;
    active: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Workflow Templates

Each workflow template includes:
- **Webhook Trigger** - Entry point for the workflow
- **Service Nodes** - Gmail, Google Calendar, etc.
- **User-specific Configuration** - Customized for each user
- **Credential Mapping** - Automatic credential assignment

### API Endpoints

#### 1. Workflow Creation (Automatic)
- **Regular Signup**: `/api/auth/register`
- **Google OAuth**: `/auth/google/callback`

#### 2. Workflow Management
- **Ensure Workflows**: `POST /api/workflows/ensure`
- **Get User Workflows**: `GET /api/workflows`

## Files Modified/Created

### New Files
- `server/workflowService.ts` - Main workflow management service
- `test-workflow-creation.js` - Test script for workflow creation
- `WORKFLOW_INTEGRATION_README.md` - This documentation

### Modified Files
- `shared/schema.ts` - Added UserWorkflows schema
- `server/storage.ts` - Added workflow tracking methods
- `server/routes.ts` - Integrated workflow creation into signup flow

## Workflow Creation Process

### 1. User Signup Flow
```typescript
// Regular signup
app.post('/api/auth/register', async (req, res) => {
  // ... create user ...
  
  // Create workflows
  const workflows = await createUserWorkflows(user.id, user.email);
  
  // ... return response ...
});

// Google OAuth signup
app.get('/auth/google/callback', async (req, res) => {
  // ... handle OAuth ...
  
  // Create workflows with credentials
  const workflows = await createUserWorkflows(user.id, user.email);
  
  // ... redirect user ...
});
```

### 2. Workflow Creation Logic
```typescript
export async function createUserWorkflows(userId: string, userEmail: string) {
  // Check if user already has workflows
  const existingWorkflows = await storage.getUserWorkflows(userId);
  if (existingWorkflows?.workflows.length > 0) {
    return existingWorkflows.workflows; // Return existing workflows
  }

  // Get user's access info for credentials
  const accessInfo = await storage.getAccessInfo(userId);

  // Create each workflow template
  for (const [workflowName, template] of Object.entries(WORKFLOW_TEMPLATES)) {
    // Customize template for user
    const customizedTemplate = {
      ...template,
      name: `${workflowName} - ${userEmail}`,
      nodes: template.nodes.map(node => ({
        ...node,
        id: `${node.id}-${userId}`,
        credentials: accessInfo ? getCredentialsForNode(node.type, accessInfo) : undefined
      }))
    };

    // Create workflow in n8n
    const response = await axios.post(`${N8N_BASE_URL}/workflows`, customizedTemplate);
    
    // Track in database
    await storage.addWorkflowToUser(userId, workflowName, response.data.id);
  }
}
```

## Usage Examples

### Frontend Integration

```typescript
// Ensure workflows exist when user logs in
const ensureWorkflows = async () => {
  const response = await fetch('/api/workflows/ensure', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('Workflows ensured:', data.workflows);
};

// Get user's workflows
const getWorkflows = async () => {
  const response = await fetch('/api/workflows', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('User workflows:', data.workflows);
};
```

### Testing

```bash
# Test workflow creation
node test-workflow-creation.js
```

## Benefits

1. **Seamless User Experience** - Users get working workflows immediately after signup
2. **No Manual Configuration** - Credentials are automatically applied
3. **Scalable** - Each user gets their own isolated workflows
4. **Maintainable** - Centralized workflow templates and management
5. **Reliable** - Duplicate prevention ensures data integrity

## Security Considerations

- Workflows are isolated per user
- Credentials are user-specific
- API access is authenticated
- No cross-user data leakage

## Future Enhancements

1. **Workflow Templates** - Allow admins to create custom workflow templates
2. **Workflow Versioning** - Track workflow versions and updates
3. **Workflow Analytics** - Monitor workflow usage and performance
4. **Bulk Operations** - Admin tools for managing multiple users' workflows

## Troubleshooting

### Common Issues

1. **Workflows not created** - Check n8n API connectivity and credentials
2. **Duplicate workflows** - Verify userWorkflows collection integrity
3. **Credential issues** - Ensure access_info is properly stored
4. **API errors** - Check n8n API key and base URL configuration

### Debug Commands

```bash
# Check workflow creation logs
tail -f logs/app.log | grep WORKFLOW

# Verify user workflows in database
mongo ideofuzion --eval "db.userWorkflows.find({userId: 'USER_ID'})"

# Test n8n API connectivity
curl -H "X-N8N-API-KEY: YOUR_API_KEY" https://n8n.hireninja.site/api/v1/workflows
```
