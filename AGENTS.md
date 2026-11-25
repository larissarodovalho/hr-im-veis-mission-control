# Architecture rules

- Store institutional annual VGV targets in `metas_institucionais`, separately from user-linked `metas_vgv`, because HRX Produções is not a person or operational assignee.
- Use `profiles.ativo` and a reversible Auth ban for user deactivation; preserve roles and business links because deactivation must not erase history.
- Enforce active-user access at the Data API pre-request hook, restrictive application RLS policies and Edge Function authentication; keep role lookup unchanged because reports use historical assignees' roles.
- Change account status only through the admin endpoint and emit a data-free private per-user status doorbell because clients must close existing sessions without exposing profile data.