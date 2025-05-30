## Politician Profile Editing System

This document outlines the functionality and technical components of the new system for editing politician profiles on the platform.

### 1. Feature Overview

The Politician Profile Editing System empowers registered users to contribute to the accuracy and completeness of politician data. Users can propose changes to virtually all fields and sections available on a politician's profile page. This collaborative approach helps maintain up-to-date and comprehensive information.

### 2. How to Use (User/Contributor Perspective)

Editing a politician's profile is designed to be intuitive:

1.  **Locate Edit Buttons:** On a politician's profile page, small pencil icons (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>) will appear next to individual fields (like Name, Date of Birth) when you hover over them (on desktop) or will be persistently visible (on mobile). For larger sections like "Criminal Records" or "Asset Declarations," an "Edit Section" or similar button will be present, typically in the section's header.

2.  **Open the Edit Modal:** Clicking the pencil icon or "Edit Section" button will open an "Edit Modal."

3.  **Propose Changes:**
    *   The modal will display the field or section you are editing and its current value.
    *   Enter the new or corrected information in the provided input field(s). Different fields might offer different editor types (e.g., text input, date picker, rich text editor for biographies, or specialized editors for lists like criminal records).
    *   **Crucially, you must provide a "Reason for Change."** This field is mandatory and helps moderators understand the context and validity of your proposed edit.

4.  **Submit for Review:** Once you've entered the new value and your reason for the change, click the "Submit Edit" button.

5.  **Pending Approval:** Your proposed edit will not be published live immediately. It will be submitted to a moderation queue for review.

### 3. Moderation Process

All proposed edits undergo a review process by platform moderators. Moderators will assess the validity and accuracy of the proposed changes, referencing the provided "Reason for Change" and any other available information. Edits can be approved or denied. Users may be notified of the status of their submissions (details of notification system TBD).

### 4. Key Technical Components (For Developers & Maintainers)

The Politician Edit System is composed of several key frontend and backend components:

*   **Core UI Components:**
    *   `src/components/wiki/EditButton.tsx`: A reusable button component (pencil icon) that triggers the edit modal for a specific field. It handles responsive visibility (hover on desktop, always visible on mobile) and displays a tooltip.
    *   `src/components/wiki/EditModal.tsx`: A generic dialog component that dynamically renders the appropriate input fields based on the `fieldType` being edited. It manages the edit form's state, including the new value and change reason, and handles the submission process.

*   **Field-Specific Editors:** These components are rendered within `EditModal` to provide tailored editing experiences for different data types:
    *   `src/components/wiki/RichTextEditor.tsx`: (Currently a placeholder using a `Textarea`) Intended for editing multi-line formatted text fields like biographies or political journeys.
    *   `src/components/wiki/DateEditor.tsx`: For selecting dates, supporting both AD (Gregorian) calendar via `react-day-picker` and BS (Bikram Sambat) dates via text input.
    *   `src/components/wiki/CriminalRecordEditor.tsx`: A list-based editor for managing an array of criminal record entries, allowing users to add, edit, and remove individual records.
    *   `src/components/wiki/AssetDeclarationEditor.tsx`: Similar to the criminal record editor, this component manages a list of yearly asset declarations.

*   **Backend Action:**
    *   `src/lib/actions/politician.actions.ts` contains the `submitPoliticianEdit` server action. This function is called by the `EditModal` upon submission.

*   **Data Storage for Edits:**
    *   Proposed edits are stored in the `pending_edits` table in the Supabase database. Each record in this table includes:
        *   `entity_type`: Typically 'Politician'.
        *   `entity_id`: The ID of the politician being edited.
        *   `proposed_data`: A JSON object containing the field name(s) and their new proposed value(s) (e.g., `{ "name": "New Politician Name" }`).
        *   `change_reason`: The mandatory reason provided by the user.
        *   `proposer_id`: The ID of the user who submitted the edit.
        *   `status`: Initially 'Pending'; changes to 'Approved' or 'Denied' after moderation.
        *   Timestamps for creation and update.

This modular architecture allows for easy extension with new editor types or modifications to existing ones.
