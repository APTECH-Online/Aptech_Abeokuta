-- Add the dedicated Content Manager role used by the RBAC migration that follows.
alter type staff_role add value if not exists 'content_manager';
