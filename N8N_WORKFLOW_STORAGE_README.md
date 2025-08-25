# N8N Workflow Storage System

## Overview

This system provides a comprehensive solution for storing and managing n8n workflows in a MongoDB database. It includes complete workflow data, metadata, and user-specific organization.

## Database Collection: `n8n_workflows`

### Collection Name
**`n8n_workflows`**

### Schema Structure

```typescript
interface IN8nWorkflow {
  _id: string;                    // MongoDB ObjectId
  userId: string;                 // User who owns the workflow
  n8nId: string;                  // Original n8n workflow ID
  name: string;                   // Workflow name
  description?: string;           // Optional description
  active: boolean;                // Whether workflow is active in n8n
  workflowData: any;              // Complete workflow JSON data from n8n
  metadata: {
    createdAt: Date;              // When workflow was first stored
    updatedAt: Date;              // Last update timestamp
    version: string;              // Workflow version
    tags?: string[];              // Workflow tags
    category?: string;            // Workflow category
  };
  status: 'active' | 'inactive' | 'archived';  // Local status
  createdAt: Date;                // Database record creation time
  updatedAt: Date;                // Database record update time
}
```

### Indexes
- `{ userId: 1, n8nId: 1 }` (unique) - Ensures one workflow per user per n8n ID
- `{ userId: 1, status: 1 }` - Efficient status-based queries
- `{ userId: 1, active: 1 }` - Efficient active workflow queries

## API Endpoints

### 1. Get All User Workflows
```http
GET /api/n8n-workflows
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "workflows": [
    {
      "_id": "...",
      "userId": "user123",
      "n8nId": "QCxCZmYREkK0FODI",
      "name": "Meeting Bot & Analysis",
      "active": true,
      "workflowData": { /* complete workflow JSON */ },
      "metadata": { /* metadata object */ },
      "status": "active",
      "createdAt": "2025-01-27T10:00:00.000Z",
      "updatedAt": "2025-01-27T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Specific Workflow
```http
GET /api/n8n-workflows/:n8nId
Authorization: Bearer <token>
```

### 3. Sync Workflows from N8N
```http
POST /api/n8n-workflows/sync
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 9 workflows successfully",
  "synced": 9,
  "errors": []
}
```

### 4. Update Workflow Status
```http
PUT /api/n8n-workflows/:n8nId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active" | "inactive" | "archived"
}
```

### 5. Delete Workflow
```http
DELETE /api/n8n-workflows/:n8nId
Authorization: Bearer <token>
```

### 6. Get Workflow Statistics
```http
GET /api/n8n-workflows/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 9,
    "active": 1,
    "inactive": 7,
    "archived": 1
  }
}
```

## Service Layer

### N8nWorkflowService

The service provides the following methods:

- `fetchAllWorkflows()` - Fetch all workflows from n8n instance
- `fetchWorkflowById(id)` - Fetch specific workflow from n8n
- `storeWorkflow(userId, workflowData)` - Store workflow in database
- `storeAllWorkflows(userId)` - Store all workflows for a user
- `getUserWorkflows(userId)` - Get all workflows for a user from database
- `getUserWorkflow(userId, n8nId)` - Get specific workflow for a user
- `updateWorkflowStatus(userId, n8nId, status)` - Update workflow status
- `deleteWorkflow(userId, n8nId)` - Delete workflow from database
- `syncWorkflows(userId)` - Sync workflows from n8n to database
- `getWorkflowStats(userId)` - Get workflow statistics

## Population Script

### Running the Population Script

To populate the database with your current n8n workflows:

```bash
node populate-n8n-workflows.js
```

This script will:
1. Connect to your MongoDB database
2. Read the existing `workflow-ids.json` file
3. Fetch complete workflow data from your n8n instance
4. Store each workflow in the `n8n_workflows` collection
5. Provide a detailed summary of the operation

### Configuration

Update the following variables in `populate-n8n-workflows.js`:

```javascript
const N8N_BASE_URL = 'https://n8n.hireninja.site/api/v1';
const N8N_API_KEY = 'your-api-key';
const TEST_USER_ID = 'your-user-id'; // Replace with actual user ID
```

## Environment Variables

Add these to your `.env` file:

```env
N8N_BASE_URL=https://n8n.hireninja.site/api/v1
N8N_API_KEY=your-n8n-api-key
MONGODB_URI=your-mongodb-connection-string
```

## Features

### 1. Complete Workflow Storage
- Stores the full workflow JSON data from n8n
- Preserves all nodes, connections, and settings
- Maintains workflow versioning information

### 2. User Isolation
- Each workflow is associated with a specific user
- Users can only access their own workflows
- Secure multi-tenant architecture

### 3. Status Management
- Track workflow status (active/inactive/archived)
- Separate from n8n's active status
- Local workflow management capabilities

### 4. Metadata Tracking
- Version information
- Creation and update timestamps
- Tags and categories
- Custom metadata support

### 5. Synchronization
- Sync workflows from n8n to database
- Update existing workflows
- Handle errors gracefully

### 6. Statistics and Analytics
- Workflow counts by status
- User-specific statistics
- Performance metrics

## Usage Examples

### Frontend Integration

```typescript
// Fetch user's workflows
const response = await fetch('/api/n8n-workflows', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { workflows } = await response.json();

// Sync workflows from n8n
const syncResponse = await fetch('/api/n8n-workflows/sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { synced, errors } = await syncResponse.json();

// Update workflow status
await fetch(`/api/n8n-workflows/${n8nId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'archived' })
});
```

### Backend Usage

```typescript
import { n8nWorkflowService } from './n8nWorkflowService';

// Get user workflows
const workflows = await n8nWorkflowService.getUserWorkflows(userId);

// Sync workflows
const result = await n8nWorkflowService.syncWorkflows(userId);

// Get statistics
const stats = await n8nWorkflowService.getWorkflowStats(userId);
```

## Benefits

1. **Complete Backup**: Full workflow data is stored locally
2. **Version Control**: Track workflow changes over time
3. **User Management**: Secure user-specific workflow storage
4. **Offline Access**: Access workflow data without n8n connection
5. **Analytics**: Track workflow usage and performance
6. **Migration**: Easy workflow migration between environments
7. **Audit Trail**: Complete history of workflow changes

## Security Considerations

- All endpoints require authentication
- User isolation ensures data privacy
- API keys are stored securely in environment variables
- Database indexes optimize query performance
- Input validation prevents injection attacks

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check MongoDB connection string
2. **Authentication Errors**: Verify n8n API key
3. **Permission Errors**: Ensure user has access to workflows
4. **Sync Failures**: Check n8n instance availability

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=n8n-workflow:*
```

## Future Enhancements

- Workflow templates and sharing
- Advanced search and filtering
- Workflow comparison tools
- Automated backup scheduling
- Workflow performance metrics
- Integration with version control systems
