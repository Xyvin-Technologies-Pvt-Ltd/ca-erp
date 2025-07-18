# Cron Job Functionality

This document describes the cron job functionality implemented in the CA-ERP system.

## Overview

The cron job system allows users to automatically create projects for clients on a recurring basis (weekly, monthly, or yearly). This is particularly useful for recurring services like monthly reports, quarterly audits, or annual reviews.

## Features

### 1. Section Management
- Create sections to organize cron jobs (e.g., "Monthly Reports", "Quarterly Audits")
- Each section can contain multiple cron jobs
- Sections help organize recurring projects by category

### 2. Cron Job Creation
- **Project Name**: The name of the project to be created
- **Start Date**: When the first project should be created
- **Frequency**: Weekly, Monthly, or Yearly
- **Description**: Optional description for the project
- **Section**: Which section the cron job belongs to

### 3. Automatic Project Creation
- Projects are automatically created based on the cron job schedule
- Project start date is set to the scheduled run date
- Project due date is calculated based on frequency:
  - Weekly: 7 days from start date
  - Monthly: 1 month from start date
  - Yearly: 1 year from start date

### 4. Manual Execution
- Users can manually execute cron jobs to create projects immediately
- Useful for testing or when immediate project creation is needed

## Backend Implementation

### Models
- **CronJob**: Stores cron job configuration and metadata
- **Project**: Created automatically by cron jobs

### Services
- **CronService**: Manages cron job scheduling and execution
- Uses `node-cron` for reliable cron job scheduling

### Controllers
- **cronJob.controller.js**: Handles CRUD operations for cron jobs
- **executeCronJob**: Manually execute a cron job

### Routes
- `GET /api/cronjobs` - Get all cron jobs for a client
- `POST /api/cronjobs` - Create a new cron job
- `PUT /api/cronjobs/:id` - Update a cron job
- `DELETE /api/cronjobs/:id` - Delete a cron job
- `POST /api/cronjobs/:id/execute` - Manually execute a cron job
- `GET /api/cronjobs/sections/:clientId` - Get sections for a client

## Frontend Implementation

### Components
- **CronJobSection**: Manages sections and project creation within sections
- **CronJobList**: Displays and manages existing cron jobs

### Features
- Create new sections
- Add projects to sections with frequency settings
- View all cron jobs for a client
- Execute cron jobs manually
- Delete cron jobs

## Usage

### Creating a Section
1. Navigate to a client's details page
2. Go to the "Annual & Monthly" tab
3. Click "Add New Section"
4. Enter a section name and click "Create Section"

### Adding a Project to a Section
1. In the section, click "Add Project"
2. Fill in the project details:
   - Project Name
   - Start Date
   - Frequency (Weekly/Monthly/Yearly)
   - Description (optional)
3. Click "Create Cron Job"

### Managing Cron Jobs
- View all cron jobs in the "Existing Cron Jobs" section
- Execute a cron job manually by clicking "Execute"
- Delete a cron job by clicking "Delete"

## Technical Details

### Cron Expressions
The system generates cron expressions based on the start date and frequency:
- **Weekly**: `minute hour * * dayOfWeek`
- **Monthly**: `minute hour day * *`
- **Yearly**: `minute hour day month *`

### Database Schema
```javascript
{
  name: String,           // Project name
  client: ObjectId,       // Client reference
  section: String,        // Section name
  frequency: String,      // weekly/monthly/yearly
  startDate: Date,        // Initial start date
  nextRun: Date,          // Next scheduled run
  lastRun: Date,          // Last execution time
  isActive: Boolean,      // Whether job is active
  description: String,    // Project description
  createdBy: ObjectId,    // User who created the job
  deleted: Boolean        // Soft delete flag
}
```

### Activity Tracking
- Cron job creation is tracked in the activity log
- Project creation from cron jobs is tracked
- All activities are linked to the appropriate entities

## Security
- All cron job operations require authentication
- Users can only manage cron jobs for clients they have access to
- Soft delete ensures data integrity

## Monitoring
- All cron job activities are logged
- Failed executions are logged with error details
- Cron service status is logged during startup

## Future Enhancements
- Email notifications for created projects
- More granular frequency options (bi-weekly, quarterly)
- Project templates for different types of recurring work
- Bulk operations for multiple cron jobs
- Advanced scheduling options (specific days, business days only) 