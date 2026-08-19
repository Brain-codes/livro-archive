-- Ensure service_role (used exclusively by Edge Functions) has full table access.
-- RLS remains deny-all for anon/authenticated; service_role bypasses RLS but still
-- needs explicit GRANTs, which weren't inherited automatically for these new tables.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
