# Test Workflows for Nexus Platform

This directory contains 10 test workflows designed to validate the GitHub sync functionality of the Nexus Platform.

## Workflows Overview

1. **deploy-production.yml** - Production deployment with environment, version, and notification options
2. **run-tests.yml** - Test suite execution with browser and parallel job configurations
3. **database-migration.yml** - Database migration management with rollback and backup options
4. **build-docker-image.yml** - Docker image building with multi-platform and registry support
5. **security-scan.yml** - Security scanning with severity thresholds and reporting
6. **cleanup-resources.yml** - Resource cleanup with age thresholds and dry-run options
7. **performance-benchmark.yml** - Performance testing with load and duration settings
8. **backup-data.yml** - Data backup with compression, encryption, and retention options
9. **feature-toggle.yml** - Feature flag management with percentage rollouts
10. **sync-dependencies.yml** - Dependency updates with package manager selection

## Input Types Tested

Each workflow tests different GitHub Actions input types:
- ✅ **choice** - Dropdown selection with predefined options
- ✅ **string** - Text input fields
- ✅ **number** - Numeric input fields
- ✅ **boolean** - Checkbox/toggle inputs

## Testing the Sync Functionality

### 1. Start the Application
```bash
# Terminal 1: Start the Next.js app and worker together
pnpm dev:full

# Or separately:
# Terminal 1: Start the Next.js app
pnpm dev

# Terminal 2: Start the worker process
pnpm worker:dev
```

### 2. Add a Repository
1. Navigate to `/dashboard/repositories`
2. Click "Add Repository"
3. Add this repository (or any repository containing these workflows)
4. Add a GitHub token with `repo` and `workflow` scopes

### 3. Trigger Sync
1. Click the sync button on the repository
2. Enable "Sync Workflows" and "Sync Branches"
3. Watch the real-time progress updates

### 4. Verify Results
After sync completion, check:
- **Workflows Table**: All 10 workflows should appear
- **Workflow Branches**: Each workflow should have branch-specific input configurations
- **Database**: Verify workflow inputs are parsed correctly from YAML

### 5. Test Workflow Inputs
The sync should extract and store inputs like:
```json
{
  "environment": {
    "description": "Deployment environment",
    "required": true,
    "default": "production",
    "type": "choice",
    "options": ["production", "staging"]
  },
  "version": {
    "description": "Version to deploy",
    "required": true,
    "default": "latest",
    "type": "string"
  }
}
```

## Expected Sync Results

| Workflow | Expected Inputs | Input Types |
|----------|----------------|-------------|
| deploy-production | 4 inputs | choice, string, boolean |
| run-tests | 4 inputs | choice, string, number |
| database-migration | 5 inputs | choice, string, boolean |
| build-docker-image | 5 inputs | string, choice, boolean |
| security-scan | 4 inputs | choice, boolean |
| cleanup-resources | 4 inputs | choice, number, boolean, string |
| performance-benchmark | 6 inputs | choice, number, string, boolean |
| backup-data | 6 inputs | choice, boolean, number |
| feature-toggle | 6 inputs | string, choice, number, boolean |
| sync-dependencies | 6 inputs | choice, string, boolean |

## Troubleshooting

### Common Issues
1. **Worker not processing jobs**: Check Redis connection and worker logs
2. **GitHub API errors**: Verify token scopes and rate limits
3. **YAML parsing errors**: Check workflow file syntax
4. **Database connection issues**: Verify DATABASE_URL environment variable

### Debug Commands
```bash
# Check worker logs
pnpm worker

# Test TypeScript compilation
npx tsc --noEmit

# Check database connection
pnpm db:seed

# Verify Redis connection
redis-cli ping
```

## Environment Variables

Make sure these are set in your `.env.local`:
```env
# Required for GitHub integration
GITHUB_CLIENT_ID=your_github_app_id
GITHUB_CLIENT_SECRET=your_github_app_secret

# Required for worker processes
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/nexus
```