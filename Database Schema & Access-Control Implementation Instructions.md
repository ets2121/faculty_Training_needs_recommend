# Database Schema & Access-Control Implementation Instructions

## Objective

Implement the database layer for the existing project.

The project context and functional requirements are already known. Focus specifically on:

- MySQL database schema
- Database relationships
- Authentication data
- Authorization
- Role-based access control
- Department-based data isolation
- Faculty-based data isolation
- Audit/history records
- Database migrations and seed/reference data
- Compatibility with both local XAMPP MySQL and remote/server MySQL

Do not redesign the application's frontend unless it is necessary to integrate authentication and authorization with the database.

---

## 1. Database

Use **MySQL** as the primary relational database.

The database must work in both:

- Local development using XAMPP/MySQL
- Remote/server MySQL deployment

Database connection settings must be configurable through environment variables or the project's existing configuration system.

Do **not** hardcode:

- Database host
- Database port
- Database username
- Database password
- Database name

The application should be able to switch between local and production MySQL by changing configuration/environment variables rather than modifying application logic.

---

## 2. Database Name

The implementation must support a configurable database name.

The database name should come from the existing environment/configuration mechanism.

If the project already has a database configuration system, use it instead of creating a duplicate configuration mechanism.

Do not hardcode the database name inside application code, queries, models, migrations, or services unless required by the framework.

---

## 3. Database Schema

Inspect the existing project structure, entities, models, services, and data requirements before designing the schema.

Create the complete relational schema required by the existing project.

The schema should include the necessary tables for:

- Users/accounts
- Authentication-related information
- Roles
- Permissions, if required
- Departments
- Faculty
- Department administrators
- System administrators
- Existing project-specific/core entities
- Relationships between users and project entities
- Audit/history
- Supporting/reference data

Do not create unrelated tables.

Every table must have a clear purpose.

---

## 4. Relational Design

Use proper relational database design.

For each table, determine:

- Primary key
- Foreign keys
- Required fields
- Nullable fields
- Default values
- Unique constraints
- Indexes
- Status fields where appropriate
- `created_at`
- `updated_at`
- Other timestamps when required

Use appropriate MySQL data types.

Do not store multiple unrelated values inside a single column.

Avoid unnecessary duplication of information.

Use foreign keys to enforce relationships and referential integrity.

---

## 5. User and Authentication Structure

Use a unified user/account structure.

Do not create completely separate authentication systems for:

- Faculty
- Department Administrator
- System Administrator

Instead, use a common user/account structure with role-based authorization.

The database must allow the application to determine:

- Authenticated user
- User ID
- User role
- User's department
- Whether the user is a normal faculty member
- Whether the user is a department administrator
- Whether the user is a system administrator
- Records associated with the authenticated user
- Records associated with the user's department

Authentication credentials must be stored securely according to the framework/application's authentication system.

Never store plaintext passwords.

---

## 6. User Roles

The system must support these access levels:

### Faculty

Normal faculty user.

### Department Administrator

Administrator associated with a specific department.

### System Administrator

System-wide administrator.

The schema should allow the application to determine a user's authorization scope without relying solely on frontend logic.

---

## 7. Faculty Data Scope

A normal Faculty user must only be able to access data that belongs to or is assigned to that faculty member.

The database relationships must allow the backend to determine ownership.

For example:

`User → Faculty → Faculty-owned records`

A Faculty user must not be able to access another faculty member's restricted records by simply changing an ID or request parameter.

Authorization must therefore be enforced by the backend using authenticated-user relationships.

Do not rely on frontend filtering as the security mechanism.

---

## 8. Department Administrator Scope

A Department Administrator must be associated with a specific department.

The database must clearly represent this relationship.

For example:

`User → Department Administrator → Department`

A Department Administrator must be able to access relevant faculty and records belonging to their own department.

A Department Administrator must not automatically have access to unrelated departments.

The backend must verify department ownership/scope before allowing access to department-level records.

---

## 9. System Administrator Scope

A System Administrator has system-wide administrative scope.

The schema must support access to:

- All departments
- All faculty
- All applicable project records
- System-level administrative data

Do not duplicate records for the System Administrator.

System-wide access should be determined through the user's role and authorization scope.

---

## 10. Role-Based Access Control

Implement role-based authorization through the database structure.

At minimum, the schema must support:

- Faculty role
- Department Administrator role
- System Administrator role

If the existing project benefits from granular permissions, implement a permission structure such as:

- Roles
- Permissions
- Role-permission relationships
- User-role relationships where appropriate

Do not unnecessarily hardcode authorization rules throughout the application.

The backend should be able to determine a user's permissions from their authenticated identity and database relationships.

---

## 11. Authorization Requirements

The backend must be able to answer the following questions for every authenticated request:

1. Who is the user?
2. What role does the user have?
3. What department is the user associated with?
4. Is the user a faculty member?
5. Which faculty member does the user represent?
6. Is the user a department administrator?
7. Which department does the administrator control?
8. Is the user a system administrator?
9. Which records belong to the user?
10. Which records belong to the user's department?
11. Does the user's role permit the requested operation?

Authorization must be enforced server-side.

Frontend restrictions are not considered sufficient security.

---

## 12. Department Relationships

Departments must be represented as a dedicated relational entity if the existing project requires department-level organization.

Faculty records should be associated with a department where applicable.

Department administrators must also be associated with their assigned department.

The database should support relationships similar to:

`Department → Faculty`

`Department → Department Administrators`

`Faculty → User`

`Faculty → Faculty-specific records`

`Department → Department-specific records`

Use foreign keys and indexes for these relationships.

---

## 13. Project-Specific Entities

Inspect the existing project before creating project-specific tables.

Identify all existing entities and determine:

- Which entities require their own tables
- Which entities belong to a faculty member
- Which entities belong to a department
- Which entities are system-wide
- Which entities require historical tracking
- Which entities require status tracking
- Which entities require soft deletion, if appropriate

Do not invent project entities that are not required by the existing project.

Integrate the new schema with the project's existing data model.

---

## 14. Audit and History

Create the required audit/history structure.

Important application changes and administrative actions should be traceable.

The audit/history system should be capable of recording:

- User who performed the action
- User ID
- User role, when appropriate
- Action type
- Affected entity/table
- Affected record ID
- Timestamp
- Previous value, when necessary
- New value, when necessary
- Relevant metadata/context

Examples of actions that may require history include:

- Creating records
- Updating records
- Deleting records
- Changing status
- Changing roles
- Changing department assignments
- Administrative changes
- Other important state changes identified from the existing project

Do not store unnecessary sensitive information in the audit log.

The audit structure should support future investigation, reporting, and accountability.

---

## 15. Timestamps

Use timestamps consistently.

Where appropriate, tables should include:

- `created_at`
- `updated_at`

History/audit records should include an appropriate event timestamp.

Additional timestamps may be used where required, such as:

- Activated at
- Deactivated at
- Deleted at
- Last login
- Other project-specific events

Do not add timestamps that have no meaningful purpose.

---

## 16. Status and Account State

Where applicable, use explicit status/state fields rather than relying on ambiguous values.

Examples include:

- Active
- Inactive
- Pending
- Suspended
- Archived

Use the project's actual requirements when determining the final values.

Account state and record state should be distinguishable.

---

## 17. Indexing

Create appropriate indexes for frequently queried fields.

Pay particular attention to:

- User IDs
- Email/username fields
- Role relationships
- Department IDs
- Faculty IDs
- Foreign keys
- Status fields where useful
- Frequently filtered fields
- Audit/history lookup fields
- Timestamps used for history queries

Do not create indexes blindly.

Indexes should support actual application queries and relationships.

---

## 18. Constraints

Use database-level constraints wherever appropriate.

Include:

- Primary keys
- Foreign keys
- Unique constraints
- `NOT NULL`
- Appropriate defaults
- Check constraints where supported and useful
- Referential integrity

Important security and data-integrity assumptions should not depend exclusively on application code.

---

## 19. Migrations

Create proper database migrations using the project's existing framework or migration system.

Migrations should be:

- Ordered
- Repeatable
- Maintainable
- Reversible where supported
- Independent of a specific local database installation

Do not require manually editing SQL files every time the database is deployed.

The migration structure must support both:

- Local XAMPP MySQL
- Production/server MySQL

---

## 20. Seed Data

Create seed/reference data for fixed system values where appropriate.

At minimum, provide the required initial roles:

- Faculty
- Department Administrator
- System Administrator

If permissions are implemented, seed the required permissions and role-permission relationships.

Do not create fake production users unless the existing development environment requires test accounts.

Development/test seed data should be clearly separated from required system reference data.

---

## 21. Database Configuration

Use environment-based configuration.

The configuration should conceptually support:

- Database host
- Database port
- Database name
- Database username
- Database password
- Database driver

Local example:

`localhost` / XAMPP MySQL

Production example:

Remote MySQL server

Switching from local to production should require configuration changes only, not changes to application queries or business logic.

---

## 22. Query Compatibility

Write database queries using the project's database abstraction layer or ORM where available.

Do not create unnecessary database-specific queries if the existing framework provides an abstraction.

When raw SQL is required, ensure it is compatible with the selected MySQL version and follows secure query practices.

Never concatenate untrusted user input directly into SQL queries.

Use parameterized queries, prepared statements, or the framework's query builder/ORM.

---

## 23. Security

The database implementation must follow these principles:

- Never store plaintext passwords.
- Never expose database credentials to the frontend.
- Never rely on frontend authorization for security.
- Never trust IDs supplied directly by the client.
- Always verify ownership or department scope on the backend.
- Use parameterized queries/prepared statements.
- Apply least-privilege database access where practical.
- Avoid storing unnecessary sensitive data.
- Record important administrative changes in the audit/history system.

---

## 24. Expected Implementation

Before modifying the database, inspect the existing project and identify how its current data model works.

Then:

1. Determine the required entities.
2. Determine relationships between entities.
3. Design the normalized MySQL schema.
4. Add authentication/account structures.
5. Add roles and permissions where appropriate.
6. Add department and faculty relationships.
7. Add audit/history structures.
8. Add indexes and constraints.
9. Create migrations.
10. Create required seed/reference data.
11. Integrate the schema with the existing backend.
12. Verify authentication and authorization relationships.
13. Verify Faculty data isolation.
14. Verify Department Administrator department isolation.
15. Verify System Administrator system-wide scope.
16. Verify audit/history recording.
17. Verify the same application code can work with local and remote MySQL through configuration changes.

---

## 25. Final Validation

After implementation, verify the following scenarios.

### Faculty

- Faculty can authenticate.
- Faculty role is correctly identified.
- Faculty can access their own permitted records.
- Faculty cannot access another faculty member's restricted records.
- Faculty cannot bypass authorization by changing record IDs.

### Department Administrator

- Department Administrator can authenticate.
- Department Administrator role is correctly identified.
- Department Administrator is associated with the correct department.
- Department Administrator can access permitted records within their department.
- Department Administrator cannot access unrelated departments.

### System Administrator

- System Administrator can authenticate.
- System Administrator role is correctly identified.
- System Administrator has system-wide authorization according to the application's requirements.

### Audit

- Important actions generate history/audit records.
- Audit records identify the responsible user.
- Audit records identify the affected entity/record.
- Audit records contain the appropriate timestamp.
- Relevant before/after values are captured when necessary.

### Database portability

- The schema works on local XAMPP MySQL.
- The schema works on the production/server MySQL environment.
- Database switching requires configuration/environment changes rather than application-code modifications.

---

## 26. Important Implementation Rule

Do not modify the existing application's business behavior unnecessarily.

The goal is to build a clean, secure, normalized MySQL database structure that integrates with the existing project and provides the foundation for:

- Authentication
- Authorization
- Role-based access
- Faculty-level data isolation
- Department-level data isolation
- System-level administration
- Audit/history
- Future expansion

Use the existing project knowledge and codebase as the source of truth for project-specific entities and requirements.