# Task Assignment Logic Implementation

## Overview
Implemented conditional user assignment logic in the task creation form based on user roles.

## Business Rules Implemented

### Role-Based Task Assignment:

1. **Admin & Manager Roles**
   - Can create tasks and assign to ANY user
   - Full access to the "Assigned To" dropdown
   - All users are visible in the selection list

2. **Staff & Finance Roles**
   - Can only create tasks assigned to themselves
   - The "Assigned To" field is automatically populated with their own ID
   - The field is DISABLED and read-only
   - Only their own name appears in the dropdown (marked as "You")
   - Visual indicator shows "Tasks are automatically assigned to you"

## Changes Made

### Frontend Changes

#### File: `frontend/src/components/TaskForm.jsx`

**1. Added User Role Documentation:**
```javascript
/**
 * USER ASSIGNMENT RULES:
 * - Admin/Manager: Can assign tasks to any user
 * - Staff/Finance: Can only create tasks assigned to themselves (auto-assigned, disabled select)
 */
```

**2. Updated User Loading Logic (useEffect):**
- Detects user role from `user` object (from AuthContext)
- Auto-assigns current user if role is "staff" or "finance"
- Loads all users for admin/manager roles

```javascript
useEffect(() => {
  // When loading users:
  if (user?.role === "staff" || user?.role === "finance") {
    // Auto-assign to the current user
    setAssignedTo(user._id);
  }
}, [token, user]);
```

**3. Updated Assigned To Select Field:**
- **Conditional Disabling:** Field is disabled for staff/finance users
- **Conditional User List:**
  - Admin/Manager: Show all users
  - Staff/Finance: Show only current user with "(You)" label
- **Visual Feedback:**
  - Disabled state styling (gray background, reduced opacity)
  - Helper text: "Tasks are automatically assigned to you"
  - Lock icon appearance when disabled
- **Change Handler Protection:**
  - onChange only processes if user is admin or manager

```javascript
disabled={user?.role === "staff" || user?.role === "finance"}
onChange={(e) => {
  if (user?.role === "admin" || user?.role === "manager") {
    setAssignedTo(e.target.value);
    setIsFormDirty(true);
  }
}}
```

**4. Conditional User Options:**
- Admin/Manager: Display all users from the list
- Staff/Finance: Filter and display only current user

## User Context Data Structure

The user object is stored in localStorage and contains:
```javascript
{
  _id: "67f54137ca7f2422c0e39cdb",
  name: "Admin User",
  email: "admin@ca-erp.com",
  role: "admin",  // or "staff", "manager", "finance"
  department: "686ded054d67ded62c1b1281",
  position: "686fa413e5beafed26212958",
  status: "active",
  workType: "onsite",
  // ... other fields
}
```

## Testing Scenarios

### Scenario 1: Admin User
- ✅ Opens task creation form
- ✅ "Assigned To" dropdown is enabled
- ✅ Can select any user from the full list
- ✅ Can change selection multiple times

### Scenario 2: Manager User
- ✅ Opens task creation form
- ✅ "Assigned To" dropdown is enabled
- ✅ Can select any user from the full list
- ✅ Can change selection multiple times

### Scenario 3: Staff User
- ✅ Opens task creation form
- ✅ "Assigned To" shows only their name with "(You)" label
- ✅ Field is disabled (grayed out)
- ✅ Cannot change the assignment
- ✅ Helper text visible: "Tasks are automatically assigned to you"
- ✅ Form validates and assigns to staff user on submission

### Scenario 4: Finance User
- ✅ Opens task creation form
- ✅ "Assigned To" shows only their name with "(You)" label
- ✅ Field is disabled (grayed out)
- ✅ Cannot change the assignment
- ✅ Helper text visible: "Tasks are automatically assigned to you"
- ✅ Form validates and assigns to finance user on submission

## Form Validation

When editing existing tasks:
- Admin/Manager: Can reassign tasks to different users
- Staff/Finance: Cannot modify the assigned user if editing their own task
- The auto-assignment only applies to newly created tasks

## Backend Integration

No backend changes required:
- Backend already accepts `assignedTo` field from frontend
- Existing task creation and update endpoints remain unchanged
- The filtering/disabling is purely frontend logic

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── CreateTaskModal.jsx (wrapper component)
│   │   └── TaskForm.jsx ⭐ (MODIFIED - main form logic)
│   ├── context/
│   │   └── AuthContext.js (provides user data)
│   └── pages/
│       └── hrm/
│           └── Employees.jsx (main employees page)
```

## Environment Context

Uses localStorage data:
- Key: `auth_token` - JWT authentication token
- Retrieved via: `useAuth()` hook from AuthContext
- User object contains role information

## Browser Compatibility

All CSS and JavaScript features used are compatible with modern browsers:
- CSS: opacity, disabled state styling
- JavaScript: Optional chaining (?.), nullish coalescing
- React hooks: useState, useEffect

## Performance Considerations

- Users list is loaded once on component mount
- Auto-assignment logic runs during data load
- No re-renders on field disable (CSS-only styling)
- Efficient filtering for staff/finance users

## Future Enhancements

1. Add audit logging for task assignments
2. Implement task reassignment notifications
3. Add role-based task visibility filters
4. Implement department-based task assignment rules
5. Add bulk task assignment for admins

## Notes

- The implementation respects the organizational hierarchy
- Admin and Manager roles have full flexibility
- Staff and Finance roles have restricted but clear functionality
- User experience is intuitive with clear visual feedback
