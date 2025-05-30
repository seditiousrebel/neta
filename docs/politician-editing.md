## Politician Profile Editing System

This document outlines the functionality and technical components of the system for editing politician profiles on the platform.

### 1. Feature Overview

The Politician Profile Editing System empowers registered users to contribute to the accuracy and completeness of politician data. Users can propose changes to virtually all fields and sections available on a politician's profile page. This collaborative approach helps maintain up-to-date and comprehensive information. Administrators have enhanced capabilities to edit data directly.

### 2. How to Use (User/Contributor Perspective)

Editing a politician's profile is designed to be intuitive:

1.  **Login Requirement:** To propose an edit, you must be logged into your user account. If you are not logged in, clicking an edit button will result in a notification prompting you to log in.

2.  **Locate Edit Buttons:** On a politician's profile page, small pencil icons (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>) will appear next to individual fields (like Name, Date of Birth) when you hover over them (on desktop) or will be persistently visible (on mobile). For larger sections like "Criminal Records" or "Asset Declarations," an "Edit Section" or similar button will be present, typically in the section's header.

3.  **Open the Edit Modal:** Clicking the pencil icon or "Edit Section" button (if logged in) will open an "Edit Modal."

4.  **Propose Changes:**
    *   The modal will display the field or section you are editing and its current value.
    *   Enter the new or corrected information in the provided input field(s). Different fields might offer different editor types (e.g., text input, date picker, rich text editor for biographies, or specialized editors for lists like criminal records).
    *   **Crucially, you must provide a "Reason for Change."** This field is mandatory for regular users and helps moderators understand the context and validity of your proposed edit.

5.  **Submit for Review:** Once you've entered the new value and your reason for the change, click the "Submit Edit" button.

6.  **Pending Approval:** Your proposed edit will not be published live immediately. It will be submitted to a moderation queue for review.

### 3. Admin Users - Direct Editing Workflow

Users with an "Admin" role have an expedited editing process:

*   **Direct Edits:** When an Admin user opens the Edit Modal, their changes are applied directly to the politician's profile upon submission. These edits **do not** go into the pending review queue.
*   **Optional Change Reason:** For Admin users, the "Change Reason" field in the Edit Modal is optional, though providing a reason is still encouraged for clarity and record-keeping.
*   **Revision History:** Despite bypassing the pending queue, all direct edits made by Admins are logged in the system's `entity_revisions` table, ensuring a comprehensive audit trail of changes.

### 4. Moderation Process (For Non-Admin Edits)

All edits proposed by non-admin users undergo a review process by platform moderators. Moderators will assess the validity and accuracy of the proposed changes, referencing the provided "Reason for Change" and any other available information. Edits can be approved or denied. Users may be notified of the status of their submissions (details of notification system TBD).

### 5. Key Technical Components (For Developers & Maintainers)

The Politician Edit System is composed of several key frontend and backend components:

*   **Core UI Components:**
    *   `src/components/wiki/EditButton.tsx`: A reusable button component (pencil icon) that triggers the edit modal for a specific field. It handles responsive visibility and displays a tooltip.
    *   `src/components/wiki/EditModal.tsx`: A generic dialog component that dynamically renders the appropriate input fields. It now incorporates role-based logic:
        *   For regular users, it requires a "Change Reason" and submits edits for review.
        *   For Admin users, "Change Reason" is optional, and edits are submitted for direct application.
        It manages the edit form's state and handles the submission process by calling the appropriate server action.

*   **Field-Specific Editors:** These components are rendered within `EditModal` to provide tailored editing experiences for different data types:
    *   `src/components/wiki/RichTextEditor.tsx`: (Currently a placeholder using a `Textarea`) Intended for editing multi-line formatted text fields.
    *   `src/components/wiki/DateEditor.tsx`: For selecting dates, supporting both AD and BS date formats.
    *   `src/components/wiki/CriminalRecordEditor.tsx`: Manages an array of criminal record entries.
    *   `src/components/wiki/AssetDeclarationEditor.tsx`: Manages a list of yearly asset declarations.

*   **Backend Actions (`src/lib/actions/politician.actions.ts`):**
    *   `submitPoliticianEdit`: Called for non-admin users. This action saves the proposed changes to the `pending_edits` table for moderation.
    *   `updatePoliticianDirectly`: Called for admin users. This action updates the `politicians` table directly with the new data and creates an entry in the `entity_revisions` table.

*   **Data Storage:**
    *   `pending_edits` table: Stores edits proposed by non-admin users, awaiting moderation.
    *   `politicians` table: The main table for politician data, updated directly by admins or by moderators approving pending edits.
    *   `entity_revisions` table: Logs all changes made to politician profiles, whether through approved pending edits or direct admin updates. Each record includes:
        *   `entity_type`: Typically 'Politician'.
        *   `entity_id`: The ID of the politician being edited.
        *   `data`: A JSON object containing the field name(s) and their new value(s).
        *   `change_reason`: The reason provided by the user or admin (if any).
        *   `proposer_id` / `submitter_id`: The ID of the user who submitted the edit (for pending edits) or the admin who made the direct change.
        *   `approver_id`: The ID of the moderator who approved a pending edit, or the admin's ID for direct changes.
        *   `status` (for `pending_edits`): 'Pending', 'Approved', 'Denied'.
        *   Timestamps and other relevant metadata.

This modular architecture allows for easy extension with new editor types or modifications to existing ones, while maintaining a clear distinction between regular user contributions and direct administrative actions.
