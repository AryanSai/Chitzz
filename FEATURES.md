# Chit Fund Manager (Chitzz) - Feature Documentation

Complete specification and documentation of all features built in the **Chit Fund Manager** application.

---

## 1. Chit Fund Group Management
- **Custom Group Creation**: Define total chit value, duration (months), total members count, before-pick monthly contribution dues, after-pick monthly contribution dues, and start date.
- **Configurable Payout Formula**:
  - Auto-calculates net winning payout for any cycle month based on a 1st-month base payout and monthly increment.
  - *Example:* For a ₹50,000, 20-month chit, Month 1 payout is ₹47,500, increasing by ₹500 every month.
- **Chit Group Closure**:
  - Ability to mark a chit group as **Closed**.
  - All member records and historical transactions remain permanently preserved in the master directory upon group closure.

---

## 2. Member Directory & Phone Sync
- **Master Directory**: Central database of all members with search by name or phone number and filtering options (*All*, *In Active Chit*, *Unassigned*).
- **Multi-Ticket Management**: Supports members holding multiple tickets/slots within a group or across different groups.
- **Phone Contacts Sync**: Integration with device contacts allowing quick selection and importing of member details directly from phone contacts.

---

## 3. In-Screen Payment Dues & Assignment
- **Per-Chit Payment Dashboard**: Assign payment statuses directly inside the Chit Detail screen without requiring separate screens.
- **Status Assignment**: Support for `Pending`, `Partial` (Partially paid), and `Paid` statuses.
- **Payment Modes**: Track contribution payment methods via `Cash` or `UPI`.
- **WhatsApp Reminders & Receipts**:
  - One-tap WhatsApp button to send **Payment Reminders** to pending members or **Payment Receipts** to paid members.
  - Generates pre-formatted WhatsApp URLs (`wa.me`) targeting member phone numbers.

---

## 4. Monthly Auction & Record Draw
- **Monthly Draw Recording**: Log auction winners for each cycle month.
- **Auto-Filled Winning Payout**: Payout amount is automatically filled based on the chit group's payout formula.
- **Automatic Status Update**: Updates member status to `Picked` upon winning a cycle draw.
- **Draw History**: Complete historical log of past draws with winner details, payout amounts, and draw dates inside the chit detail view.

---

## 5. Financial Reconciliation (Inflow & Outflow)
- **Cash Flow Reconciliation**: Pure tracking of Chits Inflow (collected member dues) vs Outflow (payout disbursements to auction winners) and Net Balance.
- **Strict Financial Scope**: No admin fee calculations, no expenses feature, and permanent Indian Rupee (`₹`) currency standard with `en-IN` formatting.

---

## 6. Global WhatsApp Message Templates
- **Central Settings Configuration**: Manage WhatsApp **Payment Reminder** and **Payment Receipt** message templates centrally under **Settings**.
- **Dynamic Placeholders**: Supports substitution variables:
  - `{name}` – Member Name
  - `{chit}` – Chit Group Name
  - `{due}` – Amount Due / Paid
  - `{mode}` – Payment Mode (`Cash` or `UPI`)

---

## 7. Extensible Multi-Language Support (English & Telugu)
- **Dual Language Support**: Full internationalization for **English (`en`)** and **Telugu (`తెలుగు`)**.
- **Settings Switcher**: Seamless language toggle in the Settings screen with persistent database storage.
- **Complete UI Translation**: All 4 bottom tabs, navigation headers, form inputs, status chips, and alerts render in the active language.
- **Extensible Architecture**: Modular translation dictionary structure allowing simple addition of future languages (Hindi, Tamil, Kannada, etc.).

---

## 8. Audit Logging & System Engine
- **Audit Activity Log (`/audit-log`)**: Immutable activity trail recording all financial transactions, draw events, group closures, template updates, and language changes.
- **Local SQLite Engine**: Fast offline storage powered by Expo v57 SQLite with automatic schema migration.
- **Design System**: Premium typography, clean card layouts, dark/light theme support, and strictly zero emojis across all UI elements and messages.
