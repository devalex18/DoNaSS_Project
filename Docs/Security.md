# Security Requirements

Web system for sales, layaways, inventory, purchasing, and supplier debts.
This document fulfills the Sprint 1 security deliverable: **planned validations, role-based access, secret protection, and test cases**.

---

## Authentication and sessions

| ID | Requirement |
|---|---|
| AUT-01 | Login with email and password. The error message is generic ("incorrect email or password") and does not reveal which one failed |
| AUT-02 | Passwords are stored only as a salted hash (bcrypt, argon2, or equivalent); never in plain text or in logs |
| AUT-03 | Password policy: minimum 8 characters, with letters and numbers |
| AUT-04 | Temporary lockout after 5 consecutive failed attempts (for example, 15 minutes) to stop brute force |
| AUT-05 | The session expires after 30 minutes of inactivity and is closed with "Log out" |
| AUT-06 | Session cookies with `HttpOnly`, `Secure`, and `SameSite` (or a short-lived token, if JWT is used) |
| AUT-07 | If cookies are used, CSRF protection on requests that modify data |
| AUT-08 | The user's role is taken from the session on the server, never from a field sent by the client |
| AUT-09 | An inactive user cannot log in |
| AUT-10 | Only administrators create, edit, delete, or reactivate employee accounts (S19) and can create other administrators; there is no public registration |
| AUT-11 | The first administrator account is created by a script or environment variable, not with a hard-coded password in the code |
| AUT-12 | An administrator cannot delete their own account or the last active administrator |
| AUT-13 | When an employee is deleted, their active sessions stop being valid and their history is kept (soft delete) |
| AUT-14 | Accounts created or reset by an administrator have a temporary password and must change it at first login; until then only the change-password route works (S20) |
| AUT-15 | Employees can change only their own password; contact data is edited only by administrators |
| AUT-16 | Server-side sessions (not stateless tokens) are used so a deleted user's session can be invalidated immediately |

---

## HTTP status codes

| Code | When it is used |
|---|---|
| 200 | Successful query or update |
| 201 | Resource created (product, sale, payment, order) |
| 400 | Malformed request (invalid JSON) |
| 401 | No session or expired session |
| 403 | Has a session but no permission (insufficient role or someone else's data) |
| 404 | Resource does not exist |
| 409 | Conflict (duplicate email, duplicate product, insufficient stock, expired layaway) |
| 422 | Invalid input (fields with errors) |
| 429 | Too many login attempts |
| 500 | Internal error; the message to the client is generic, with no technical details |

---

## Security test cases

### Authentication

| ID | Story | Case | Action | Expected result |
|---|---|---|---|---|
| CAS-01 | S13 | Valid login | Valid credentials | 200, correct role, session created |
| CAS-02 | S13 | Wrong password | Invalid credentials | 401, generic message |
| CAS-03 | S13 | Non-existent email address | Invalid credentials | 401, same message as in CAS-02 |
| CAS-04 | S13 | Brute force | 5 failed attempts in a row | 429, temporal ban |
| CAS-05 | S13 | Protected route without session | `GET /products` without a session | 401 |
| CAS-06 | S13 | Expired session | Inactive session for 30 minutes | 401 |
| CAS-07 | S13 | Inactive user | Login with a deactivated account | 401 |
| CAS-08 | S13 | Password stored with a hash | Check the register in the DB | The password does not appear in plain text |
||||||

### Authorization

| ID | Story | Case | Action | Expected result |
|---|---|---|---|---|
| CAS-09 | S2 | Employee create a product | `POST /products` as an employee | 403 |
| CAS-10 | S6 | Employee modifies a product | `PATCH /products/:id` as an employee | 403 |
| CAS-11 | S8 | Employee deactivate a product | `PATCH /products/:id/deactivate` as an employee | 403 |
| CAS-12 | S3 | Employee request reports | `GET /reports/sales` as an employee | 403 |
| CAS-13 | S9 | Employee request complete catalog | `GET /products/catalog` as an employee | 403 |
| CAS-14 | S11 | Employee change his commission | `PUT /commission-config` as an employee | 403 |
| CAS-15 | S18 | Employee consults debts | `GET /debts` as an employee | 403 |
| CAS-16| S1 | Employee access another sale | `GET /sales/:id` from another employee | 403 or 404 |
| CAS-17| S11 | Employee falsifies his identity | Send a third-party `user_id` when creating the sale | 401 |
| CAS-18 | S13 | Role assignation | Edit his account sending `role: "owner"` | 403 |
| CAS-19 | S5 | Employee response without sensitive data | `GET /products` as an employee | Does not includes cost and supplier |
||||||

### Data input validation

| ID | Story | Case | Action | Expected result |
|---|---|---|---|---|
| CAS-20 | S2 | Negative price | `POST /products` with negative price | 422, not saved |
| CAS-21 | S2 | Missing fields | Product without a name | 422 with the specified field |
| CAS-22 | S2 | Duplicated products | Same name, color, brand, etc. | 409 |
| CAS-23 | S4 | Invalid method | `method: bitcoin` | 422 |
| CAS-24 | S4 | Transfer without a reference number | Transfer method without a reference number | 422, not registered |
| CAS-25 | S4 | Payment exceeding the balance | Mount exceeding the balance | 422 |
| CAS-26 | S1 | Sales without stock | Quantity greater than available | 409, stock does not change |
| CAS-27 | S1 | Sales without garement | Empty list of garments | 422 |
| CAS-28 | S1 | Tempered amount | Send `total: 1` | 422 |
| CAS-29 | S12 | Invalid phone | `phone: "abc"` | 422 |
| CAS-30 | S12 | Duplicate phone | Customer with an existing phone | 409 |
| CAS-31 | S5 | SQL injection in search | `query = ' OR 1=1 --` | 400 |
| CAS-32 | S1 | SQL injection in login | Email `' OR '1'=1'` | 401, no access |
| CAS-33 | S2 | XSS in name | Name `<script>alert(1)</script>` | Rejected or shown as text, never executed |
| CAS-34 | S3 | Invalid date range | Start after end | 422 |
| CAS-35 | S5 | Invalid `id` parameter | `GET /products/abc` | 422 |
| CAS-36 | S5 | Nonexistent resource | `GET /products/99999` | 404 |
||||||

## Business rules with security impact

| ID | Story | Case | Action | Expected result |
|---|---|---|---|---|
| CAS-37 | S14 | Payment to an expired layaway | Pay a layaway older than 30 days | 409 |
| CAS-38 | S16 | Exchange for a cheaper garment | New garement with a lower proce | 422 |
| CAS-39 | S16 | Exchange without ticket | Exchange on a non-existent sale | 404 |
| CAS-40 | S16 | Exchange outside the window by employee | Employee without owner authorization | 403 |
| CAS-41 | S1 | Last garment sold at the same time | Two simultaneous sales of the last unit | One responds 201 and the other 409; stock never negative |
| CAS-42 | S15 | Receiving with a negative quantity | `amount_received: -5` | 422 |
| CAS-43 | S18 | Debt payment greater than balance | Amount above the balance | 422 |
||||||

### Employee management

| ID | Story | Case | Action | Expected result |
|---|---|---|---|---|
| CAS-48 | S19 | Employee creates an employee | `POST /usuarios` as employee | 403, not created |
| CAS-49 | S19 | Duplicate email | Create an employee with an existing email | 409 |
| CAS-50 | S19 | Weak password | Create an employee with a 5-character password | 422 |
| CAS-51 | S19 | Deleted employee tries to log in | Login with a deleted account | 401; their sales history is still intact |
| CAS-52 | S19 | Session of a deleted employee | Use an open session after the account was deleted | 401 |
| CAS-53 | S19 | Administrator deletes themselves | `DELETE /usuarios/:id` with their own id | 409 |
| CAS-54 | S19 | Delete the last administrator | Delete the only active administrator | 409 |
||||||

### Passwords, roles, and reactivation

| ID | Story | Case | Action | Expected result |
|---|---|---|---|---|
| CAS-55 | S20 | Forced password change | Log in with a temporary password and call `GET /productos` | 403 until the password is changed |
| CAS-56 | S20 | Wrong current password | Change password with an incorrect current one | 422, nothing changes |
| CAS-57 | S20 | Weak or repeated password | New password `abc123` or equal to the temporary one | 422 |
| CAS-58 | S19 | Employee edits own contact data | `PATCH /usuarios/:id` with own id as employee | 403 |
| CAS-59 | S19 | Employee creates an administrator | `POST /usuarios` with `rol: "administrador"` as employee | 403 |
| CAS-60 | S19 | Administrator creates an administrator | `POST /usuarios` with `rol: "administrador"` as administrator | 201; the new administrator can manage employees |
| CAS-61 | S19 | Reactivate employee | Reactivate a deleted employee | 200; can log in with the new temporary password; history intact |
||||||

### Secrets

| ID | Case | Check | Expected result |
|---|---|---|---|
| CAS-44 | `.env` outside the repository | Review `.gitignore` and history | `.env` ignored; no credentials in commits |
| CAS-45 | Secret scanning | Scan the repository | No findings |
| CAS-46 | 500 errors | Trigger an internal error | Generic response, no stack trace or DB data |
| CAS-47 | Pipeline | Review the workflows | Secrets come from GitHub *secrets*, not from the file |
|||||

---

## What is required in each sprint

Before each delivery, someone other than the author confirms:

- [ ] No route, except login, responds without a session.
- [ ] Each route in the permission matrix returns 403 to the wrong role.
- [ ] No employee accesses other people's sales by changing the `id`.
- [ ] All database queries use parameters.
- [ ] There are no credentials in code, commits, tests, READMEs, or the pipeline.
- [ ] Passwords are stored with a hash.
- [ ] HTTP codes match section 5.
- [ ] The ST cases for the stories implemented in the sprint pass automatically.
- [ ] Security observations from the previous review were addressed, with an issue and an administrator.