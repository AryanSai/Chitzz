import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export type ChitRecord = {
  id: number;
  name: string;
  total_value: number;
  current_month: number;
  duration: number;
  member_count: number;
  before_pick: number;
  after_pick: number;
  progress: number;
  pending_count: number;
  first_month_payout: number;
  payout_increment: number;
  payout: string;
  status: string;
  start_date: string;
  reminder_template?: string;
  receipt_template?: string;
};

export function calculateChitPayout(
  firstMonthPayout: number,
  increment: number,
  month: number,
): number {
  return firstMonthPayout + Math.max(0, month - 1) * increment;
}

export type MemberRecord = {
  id: number;
  name: string;
  phone: string;
  chit_name: string;
  status: "Active" | "Pending" | "Picked";
};

export type PaymentMode = "Cash" | "UPI";

export type PaymentRecord = {
  id: number;
  member: string;
  due: string;
  paid_amount: number;
  status: "Pending" | "Partially paid" | "Paid";
  mode: PaymentMode;
  chit_name?: string;
};

export type DrawRecord = {
  id: number;
  chit_name: string;
  cycle_month: number;
  winner_name: string;
  payout_amount: number;
  discount_amount: number;
  draw_date: string;
};

export type AuditEventRecord = {
  id: number;
  action: string;
  details: string;
  timestamp: string;
};

export type LedgerEntry = {
  id: number;
  label: string;
  amount: string;
};

const asCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const defaultReminderTemplate =
  "Hello {name}, this is a gentle payment reminder for your chit contribution ({chit}). Amount due: {due}. Please settle at your earliest convenience. Thank you!";
const defaultReceiptTemplate =
  "Payment Receipt: Received {due} from {name} for chit ({chit}) via {mode}. Status: Confirmed. Thank you for your timely payment!";

export const parseCurrency = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned || "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

const listeners = new Set<() => void>();
let database: ReturnType<typeof SQLite.openDatabaseSync>;

export function subscribeToDbChange(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyDbListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Error in DB listener:", e);
    }
  });
}

export function clearAllData() {
  database.withTransactionSync(() => {
    database.execSync(`
      DELETE FROM chits;
      DELETE FROM members;
      DELETE FROM payments;
      DELETE FROM draws;
      DELETE FROM audit_events;
    `);
  });
  notifyDbListeners();
}

export function seedSampleData() {
  clearAllData();

  createChit({
    name: "Diwali Savings 2026",
    total_value: 500000,
    current_month: 2,
    duration: 20,
    member_count: 20,
    before_pick: 25000,
    after_pick: 20000,
    first_month_payout: 475000,
    payout_increment: 5000,
    start_date: "2026-09-01",
  });

  createChit({
    name: "Gold Club Chit",
    total_value: 240000,
    current_month: 1,
    duration: 12,
    member_count: 12,
    before_pick: 20000,
    after_pick: 17000,
    first_month_payout: 220000,
    payout_increment: 2000,
    start_date: "2026-09-15",
  });

  createMember({
    name: "Demo Member One",
    phone: "N/A",
    chit_name: "Diwali Savings 2026",
    status: "Active",
    tickets: 1,
  });

  createMember({
    name: "Demo Member Two",
    phone: "N/A",
    chit_name: "Diwali Savings 2026",
    status: "Picked",
    tickets: 1,
  });

  createMember({
    name: "Demo Member Three",
    phone: "N/A",
    chit_name: "Gold Club Chit",
    status: "Active",
    tickets: 2,
  });

  createMember({
    name: "Demo Member Four",
    phone: "N/A",
    chit_name: "Unassigned",
    status: "Active",
    tickets: 1,
  });

  logAuditEvent("SEED_DATA", "Loaded sample demo data for testing.");
  notifyDbListeners();
}

function initSchema() {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS chits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_value INTEGER NOT NULL,
      current_month INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      member_count INTEGER NOT NULL,
      before_pick INTEGER NOT NULL,
      after_pick INTEGER NOT NULL,
      progress INTEGER NOT NULL,
      pending_count INTEGER NOT NULL,
      first_month_payout INTEGER NOT NULL DEFAULT 0,
      payout_increment INTEGER NOT NULL DEFAULT 0,
      payout TEXT NOT NULL,
      start_date TEXT NOT NULL DEFAULT '',
      reminder_template TEXT NOT NULL DEFAULT '',
      receipt_template TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      chit_name TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member TEXT NOT NULL,
      due TEXT NOT NULL,
      status TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'Cash',
      chit_name TEXT DEFAULT '',
      paid_amount INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chit_name TEXT NOT NULL,
      cycle_month INTEGER NOT NULL,
      winner_name TEXT NOT NULL,
      payout_amount INTEGER NOT NULL,
      discount_amount INTEGER NOT NULL,
      draw_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const ensureColumn = (table: string, column: string, definition: string) => {
    const columns = database.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!columns.some((item) => item.name === column)) {
      database.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    }
  };

  ensureColumn("chits", "first_month_payout", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("chits", "payout_increment", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("chits", "start_date", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("chits", "reminder_template", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("chits", "receipt_template", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("payments", "mode", "TEXT NOT NULL DEFAULT 'Cash'");
  ensureColumn("payments", "paid_amount", "INTEGER NOT NULL DEFAULT 0");
  database.execSync(`
    UPDATE payments
    SET paid_amount = CASE
      WHEN status = 'Paid' THEN CAST(REPLACE(REPLACE(due, '₹', ''), ',', '') AS INTEGER)
      WHEN status = 'Partially paid' THEN CAST(CAST(REPLACE(REPLACE(due, '₹', ''), ',', '') AS REAL) / 2 AS INTEGER)
      ELSE 0
    END
    WHERE paid_amount = 0 AND status IN ('Paid', 'Partially paid');
  `);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateLegacyWebStorage() {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return;
  const migrated = database.getFirstSync(
    "SELECT value FROM app_settings WHERE key = ?",
    ["legacy_web_storage_migrated"],
  );
  if (migrated) {
    localStorage.removeItem("chitzz-data-v1");
    localStorage.removeItem("chitzz-settings-v1");
    return;
  }

  const legacyDataText = localStorage.getItem("chitzz-data-v1");
  const legacySettingsText = localStorage.getItem("chitzz-settings-v1");
  const legacyData: unknown = legacyDataText ? JSON.parse(legacyDataText) : {};
  const legacySettings: unknown = legacySettingsText
    ? JSON.parse(legacySettingsText)
    : {};
  if (!isRecord(legacyData) || !isRecord(legacySettings)) {
    throw new Error("Legacy browser data is invalid and could not be imported.");
  }

  const insertRows = (
    key: string,
    insert: (row: Record<string, unknown>) => void,
  ) => {
    const rows = legacyData[key];
    if (rows === undefined) return;
    if (!Array.isArray(rows) || !rows.every(isRecord)) {
      throw new Error(`Legacy browser data contains invalid ${key} records.`);
    }
    rows.forEach(insert);
  };
  const requiredString = (row: Record<string, unknown>, key: string) => {
    const value = row[key];
    if (typeof value !== "string") {
      throw new Error(`Legacy browser record is missing a valid ${key}.`);
    }
    return value;
  };
  const numberValue = (row: Record<string, unknown>, key: string) => {
    const rawValue = row[key];
    if (
      (typeof rawValue !== "number" && typeof rawValue !== "string") ||
      (typeof rawValue === "string" && rawValue.trim() === "")
    ) {
      throw new Error(`Legacy browser record contains an invalid ${key}.`);
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`Legacy browser record contains an invalid ${key}.`);
    }
    return value;
  };
  const optionalNumberValue = (row: Record<string, unknown>, key: string) => {
    return row[key] === undefined ? 0 : numberValue(row, key);
  };

  database.withTransactionSync(() => {
    insertRows("chits", (row) => {
      database.runSync(
        `INSERT INTO chits
         (id, name, total_value, current_month, duration, member_count, before_pick, after_pick,
          progress, pending_count, first_month_payout, payout_increment, payout, start_date,
          reminder_template, receipt_template, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numberValue(row, "id"),
          requiredString(row, "name"),
          numberValue(row, "total_value"),
          numberValue(row, "current_month"),
          numberValue(row, "duration"),
          numberValue(row, "member_count"),
          numberValue(row, "before_pick"),
          numberValue(row, "after_pick"),
          numberValue(row, "progress"),
          numberValue(row, "pending_count"),
          optionalNumberValue(row, "first_month_payout"),
          optionalNumberValue(row, "payout_increment"),
          requiredString(row, "payout"),
          typeof row.start_date === "string" ? row.start_date : "",
          typeof row.reminder_template === "string" ? row.reminder_template : "",
          typeof row.receipt_template === "string" ? row.receipt_template : "",
          typeof row.status === "string" ? row.status : "active",
        ],
      );
    });
    insertRows("members", (row) => {
      database.runSync(
        "INSERT INTO members (id, name, phone, chit_name, status) VALUES (?, ?, ?, ?, ?)",
        [
          numberValue(row, "id"),
          requiredString(row, "name"),
          typeof row.phone === "string" ? row.phone : "N/A",
          typeof row.chit_name === "string" ? row.chit_name : "Unassigned",
          requiredString(row, "status"),
        ],
      );
    });
    insertRows("payments", (row) => {
      const due = requiredString(row, "due");
      const status = requiredString(row, "status");
      const paidAmount =
        row.paid_amount === undefined
          ? status === "Paid"
            ? parseCurrency(due)
            : status === "Partially paid"
              ? Math.floor(parseCurrency(due) / 2)
              : 0
          : numberValue(row, "paid_amount");
      database.runSync(
        `INSERT INTO payments
         (id, member, due, status, mode, chit_name, paid_amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          numberValue(row, "id"),
          requiredString(row, "member"),
          due,
          status,
          row.mode === "UPI" ? "UPI" : "Cash",
          typeof row.chit_name === "string" ? row.chit_name : "",
          paidAmount,
        ],
      );
    });
    insertRows("draws", (row) => {
      database.runSync(
        `INSERT INTO draws
         (id, chit_name, cycle_month, winner_name, payout_amount, discount_amount, draw_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          numberValue(row, "id"),
          requiredString(row, "chit_name"),
          numberValue(row, "cycle_month"),
          requiredString(row, "winner_name"),
          numberValue(row, "payout_amount"),
          numberValue(row, "discount_amount"),
          requiredString(row, "draw_date"),
        ],
      );
    });
    insertRows("auditEvents", (row) => {
      database.runSync(
        "INSERT INTO audit_events (id, action, details, timestamp) VALUES (?, ?, ?, ?)",
        [
          numberValue(row, "id"),
          requiredString(row, "action"),
          requiredString(row, "details"),
          requiredString(row, "timestamp"),
        ],
      );
    });
    if (Object.keys(legacySettings).length > 0) {
      const language = legacySettings.language === "te" ? "te" : "en";
      const settings = {
        reminder_template:
          typeof legacySettings.reminder_template === "string"
            ? legacySettings.reminder_template
            : defaultReminderTemplate,
        receipt_template:
          typeof legacySettings.receipt_template === "string"
            ? legacySettings.receipt_template
            : defaultReceiptTemplate,
        language,
      };
      database.runSync(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
        ["app_settings", JSON.stringify(settings)],
      );
    }
    database.runSync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      ["legacy_web_storage_migrated", "true"],
    );
  });

  localStorage.removeItem("chitzz-data-v1");
  localStorage.removeItem("chitzz-settings-v1");
}

function migrateSeedMemberIdentities() {
  const migrationKey = "seed_member_identity_migration_v1";
  if (
    database.getFirstSync("SELECT value FROM app_settings WHERE key = ?", [
      migrationKey,
    ])
  ) {
    return;
  }

  const replacements = [
    ["Rajesh Sharma", "+91 98765 43210", "Demo Member One"],
    ["Priya Patel", "+91 98123 45678", "Demo Member Two"],
    ["Amit Verma (T1)", "+91 97111 22233", "Demo Member Three (T1)"],
    ["Amit Verma (T2)", "+91 97111 22233", "Demo Member Three (T2)"],
    ["Anand Arvapelly", "+91 92999 97199", "Demo Member Four"],
  ] as const;

  database.withTransactionSync(() => {
    for (const [oldName, oldPhone, newName] of replacements) {
      const result = database.runSync(
        "UPDATE members SET name = ?, phone = 'N/A' WHERE name = ? AND phone = ?",
        [newName, oldName, oldPhone],
      );
      if (result.changes > 0) {
        database.runSync(
          "UPDATE payments SET member = ? WHERE member = ?",
          [newName, oldName],
        );
      }
    }
    database.runSync(
      "INSERT INTO app_settings (key, value) VALUES (?, ?)",
      [migrationKey, "true"],
    );
  });
}

export const databaseReady: Promise<void> = (() => {
  if (Platform.OS === "web") {
    return SQLite.openDatabaseAsync("chitzz.db").then((openedDatabase) => {
      database = openedDatabase;
      initSchema();
      migrateLegacyWebStorage();
      migrateSeedMemberIdentities();
    });
  }

  database = SQLite.openDatabaseSync("chitzz.db");
  initSchema();
  migrateLegacyWebStorage();
  migrateSeedMemberIdentities();
  return Promise.resolve();
})();

export function logAuditEvent(action: string, details: string) {
  const timestamp = new Date().toISOString();
  database.runSync(
    "INSERT INTO audit_events (action, details, timestamp) VALUES (?, ?, ?)",
    [action, details, timestamp],
  );
  notifyDbListeners();
}

export function getDashboardSummary() {
  const chits = getChits();
  const paymentRows = getPaymentRows();
  const totalDue = chits.reduce(
    (sum, chit) => sum + chit.before_pick * chit.member_count,
    0,
  );
  const pendingMembers = chits.reduce(
    (sum, chit) => sum + chit.pending_count,
    0,
  );
  const collected = paymentRows
    .reduce((sum, row) => sum + row.paid_amount, 0);
  const nextChit = chits[0]?.name ?? "No active chit";

  return {
    dueThisMonth: totalDue,
    received: collected,
    pendingMembers,
    nextChit,
  };
}

export function getChits(): ChitRecord[] {
  return database.getAllSync(
    "SELECT * FROM chits ORDER BY id ASC",
  ) as unknown as ChitRecord[];
}

export function getChitById(id: number): ChitRecord | undefined {
  const chits = getChits();
  return chits.find((c) => c.id === id);
}

export function getChitByName(name: string): ChitRecord | undefined {
  const chits = getChits();
  return chits.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

export function getMembers(): MemberRecord[] {
  return database.getAllSync(
    "SELECT * FROM members ORDER BY id ASC",
  ) as unknown as MemberRecord[];
}

export function getMemberById(id: number): MemberRecord | undefined {
  const members = getMembers();
  return members.find((m) => m.id === id);
}

export function getMembersByChit(chitName: string): MemberRecord[] {
  const members = getMembers();
  if (!chitName || chitName === "All") return members;
  return members.filter(
    (m) => m.chit_name.toLowerCase() === chitName.toLowerCase(),
  );
}

export function getPaymentRows(): PaymentRecord[] {
  return database.getAllSync(
    "SELECT * FROM payments ORDER BY id ASC",
  ).map((row) => {
    return row as unknown as PaymentRecord;
  });
}

export function getLedgerEntries(): LedgerEntry[] {
  const chits = getChits();
  const paymentRows = getPaymentRows();

  const expectedCollections = chits.reduce(
    (sum, chit) => sum + chit.before_pick * chit.member_count,
    0,
  );

  const cashCollected = paymentRows
    .filter(
      (row) =>
        row.paid_amount > 0 &&
        (row.mode === "Cash" || !row.mode),
    )
    .reduce((sum, row) => sum + row.paid_amount, 0);

  const upiCollected = paymentRows
    .filter(
      (row) =>
        row.paid_amount > 0 &&
        row.mode === "UPI",
    )
    .reduce((sum, row) => sum + row.paid_amount, 0);

  const totalCollected = cashCollected + upiCollected;
  const payouts = chits.reduce(
    (sum, chit) => sum + parseCurrency(chit.payout),
    0,
  );
  const netBalance = totalCollected - payouts;

  return [
    {
      id: 1,
      label: "Expected Inflow",
      amount: asCurrency(expectedCollections),
    },
    {
      id: 2,
      label: "Total Inflow (Collected)",
      amount: asCurrency(totalCollected),
    },
    { id: 3, label: "Cash Collections", amount: asCurrency(cashCollected) },
    { id: 4, label: "UPI Collections", amount: asCurrency(upiCollected) },
    { id: 5, label: "Payouts (Outflow)", amount: asCurrency(payouts) },
    { id: 6, label: "Net Balance", amount: asCurrency(netBalance) },
  ];
}

export function createChit(input: {
  name: string;
  total_value: number;
  current_month: number;
  duration: number;
  member_count: number;
  before_pick: number;
  after_pick: number;
  payout?: string;
  first_month_payout?: number;
  payout_increment?: number;
  start_date?: string;
  reminder_template?: string;
  receipt_template?: string;
}) {
  const startDateVal =
    input.start_date?.trim() || new Date().toISOString().split("T")[0];
  const firstPayout =
    input.first_month_payout ?? parseCurrency(input.payout || "0");
  const increment = input.payout_increment ?? 0;
  const currentPayoutAmt = calculateChitPayout(
    firstPayout,
    increment,
    input.current_month,
  );
  const payoutStr = input.payout || asCurrency(currentPayoutAmt);

  const record: ChitRecord = {
    id: 0,
    name: input.name.trim(),
    total_value: input.total_value,
    current_month: input.current_month,
    duration: input.duration,
    member_count: input.member_count,
    before_pick: input.before_pick,
    after_pick: input.after_pick,
    progress: Math.min(
      100,
      Math.round((input.current_month / input.duration) * 100),
    ),
    pending_count: Math.max(1, Math.round(input.member_count * 0.35)),
    first_month_payout: firstPayout,
    payout_increment: increment,
    payout: payoutStr,
    status: "active",
    start_date: startDateVal,
    reminder_template: input.reminder_template?.trim() || "",
    receipt_template: input.receipt_template?.trim() || "",
  };

  const result = database.runSync(
      `INSERT INTO chits (name, total_value, current_month, duration, member_count, before_pick, after_pick, progress, pending_count, first_month_payout, payout_increment, payout, start_date, reminder_template, receipt_template, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.name,
        record.total_value,
        record.current_month,
        record.duration,
        record.member_count,
        record.before_pick,
        record.after_pick,
        record.progress,
        record.pending_count,
        record.first_month_payout,
        record.payout_increment,
        record.payout,
        record.start_date,
        record.reminder_template ?? "",
        record.receipt_template ?? "",
        record.status,
      ],
    );
  record.id = result.lastInsertRowId;

  logAuditEvent(
    "CREATE_CHIT",
    `Created new chit "${record.name}" starting ${record.start_date} valued at ${asCurrency(record.total_value)}`,
  );
  notifyDbListeners();
  return record;
}

export function updateChitTemplates(
  chitId: number,
  reminderTemplate: string,
  receiptTemplate: string,
) {
  database.runSync(
      `UPDATE chits SET reminder_template = ?, receipt_template = ? WHERE id = ?`,
      [reminderTemplate.trim(), receiptTemplate.trim(), chitId],
    );
  logAuditEvent(
    "UPDATE_TEMPLATES",
    `Updated WhatsApp message templates for chit ID #${chitId}`,
  );
  notifyDbListeners();
}

export function createMember(input: {
  name: string;
  phone?: string;
  chit_name?: string;
  status: "Active" | "Pending" | "Picked";
  tickets?: number;
}) {
  const finalChitName = input.chit_name?.trim() || "Unassigned";
  const finalPhone = input.phone?.trim() || "N/A";
  const ticketCount = Math.max(1, input.tickets || 1);
  const createdMembers: MemberRecord[] = [];

  const chit = getChitByName(finalChitName);
  const dueAmount = chit
    ? input.status === "Picked"
      ? chit.after_pick
      : chit.before_pick
    : 0;

  database.withTransactionSync(() => {
    for (let i = 0; i < ticketCount; i++) {
      const memberName =
        ticketCount > 1 ? `${input.name.trim()} (T${i + 1})` : input.name.trim();
      const record: MemberRecord = {
        id: 0,
        name: memberName,
        phone: finalPhone,
        chit_name: finalChitName,
        status: input.status,
      };

      const result = database.runSync(
        `INSERT INTO members (name, phone, chit_name, status) VALUES (?, ?, ?, ?)`,
        [record.name, record.phone, record.chit_name, record.status],
      );
      record.id = result.lastInsertRowId;
      if (finalChitName !== "Unassigned" && dueAmount > 0) {
        database.runSync(
          `INSERT INTO payments (member, due, status, mode, chit_name, paid_amount) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            record.name,
            asCurrency(dueAmount),
            "Pending",
            "Cash",
            record.chit_name,
            0,
          ],
        );
      }
      createdMembers.push(record);
    }
  });

  logAuditEvent(
    "CREATE_MEMBER",
    ticketCount > 1
      ? `Added ${ticketCount} tickets for member "${input.name}" to chit "${finalChitName}"`
      : `Added member "${input.name}" to chit "${finalChitName}"`,
  );
  notifyDbListeners();
  return createdMembers[0];
}

export function deleteMember(memberId: number) {
  const member = getMemberById(memberId);
  if (!member) return false;

  database.runSync("DELETE FROM members WHERE id = ?", [memberId]);

  logAuditEvent(
    "DELETE_MEMBER",
    `Deleted member "${member.name}" from the directory. Payment history was retained.`,
  );
  return true;
}

export function updateMember(
  memberId: number,
  input: {
    name: string;
    phone: string;
    chit_name: string;
    status: MemberRecord["status"];
  },
) {
  const member = getMemberById(memberId);
  const name = input.name.trim();
  const phone = input.phone.trim() || "N/A";
  const chitName = input.chit_name.trim() || "Unassigned";
  if (!member || !name) return false;
  if (getMembers().some((item) => item.id !== memberId && item.name.toLowerCase() === name.toLowerCase())) {
    return false;
  }
  const targetChit = getChitByName(chitName);
  if (
    chitName !== "Unassigned" &&
    !targetChit &&
    chitName.toLowerCase() !== member.chit_name.toLowerCase()
  ) {
    return false;
  }

  const oldName = member.name;
  const oldChitName = member.chit_name;
  database.withTransactionSync(() => {
    database.runSync(
      "UPDATE members SET name = ?, phone = ?, chit_name = ?, status = ? WHERE id = ?",
      [name, phone, chitName, input.status, memberId],
    );

    const existingPayment = getPaymentRows().find(
      (row) => row.member === oldName && row.chit_name?.toLowerCase() === oldChitName.toLowerCase(),
    );
    if (existingPayment) {
      const assignedChit = getChitByName(chitName);
      const newDue = assignedChit
        ? asCurrency(input.status === "Picked" ? assignedChit.after_pick : assignedChit.before_pick)
        : existingPayment.due;
      const dueAmount = parseCurrency(newDue);
      const paidAmount = Math.min(existingPayment.paid_amount, dueAmount);
      const paymentStatus: PaymentRecord["status"] =
        paidAmount === 0 ? "Pending" : paidAmount >= dueAmount ? "Paid" : "Partially paid";
      database.runSync(
        "UPDATE payments SET member = ?, chit_name = ?, due = ?, paid_amount = ?, status = ? WHERE id = ?",
        [name, chitName === "Unassigned" ? existingPayment.chit_name || "" : chitName, newDue, paidAmount, paymentStatus, existingPayment.id],
      );
    } else if (targetChit && chitName !== "Unassigned") {
      const due = input.status === "Picked" ? targetChit.after_pick : targetChit.before_pick;
      if (due > 0) {
        database.runSync(
          "INSERT INTO payments (member, due, status, mode, chit_name, paid_amount) VALUES (?, ?, 'Pending', 'Cash', ?, 0)",
          [name, asCurrency(due), chitName],
        );
      }
    }
  });

  logAuditEvent(
    "UPDATE_MEMBER",
    `Updated member "${oldName}" to "${name}" and assigned to "${chitName}".`,
  );
  notifyDbListeners();
  return true;
}

export function updatePaymentStatus(
  idOrMember: number | string,
  status: "Pending" | "Partially paid" | "Paid",
  mode: PaymentMode = "Cash",
) {
  const payment = getPaymentRows().find((row) =>
    typeof idOrMember === "number"
      ? row.id === idOrMember
      : row.member === idOrMember,
  );
  if (!payment) return getPaymentRows();
  const dueAmount = parseCurrency(payment.due);
  const paidAmount =
    status === "Paid" ? dueAmount : status === "Partially paid" ? Math.floor(dueAmount / 2) : 0;

  database.runSync(
      `UPDATE payments SET status = ?, mode = ?, paid_amount = ? WHERE id = ?`,
      [status, mode, paidAmount, payment.id],
    );

  logAuditEvent(
    "UPDATE_PAYMENT",
    `Updated payment status to "${status}" via ${mode}`,
  );
  notifyDbListeners();
  return getPaymentRows();
}

export function recordPayment(paymentId: number, paidAmount: number, mode: PaymentMode) {
  const payment = getPaymentRows().find((row) => row.id === paymentId);
  if (!payment || !Number.isFinite(paidAmount)) return false;

  const dueAmount = parseCurrency(payment.due);
  const amount = Math.round(paidAmount);
  if (amount < 0 || amount > dueAmount) return false;
  const status: PaymentRecord["status"] =
    amount === 0 ? "Pending" : amount >= dueAmount ? "Paid" : "Partially paid";

  const result = database.runSync(
      "UPDATE payments SET paid_amount = ?, status = ?, mode = ? WHERE id = ?",
      [amount, status, mode, paymentId],
    );
  if (result.changes === 0) return false;
  logAuditEvent(
    "RECORD_PAYMENT",
    `Recorded ${asCurrency(amount)} paid by "${payment.member}" of ${payment.due} via ${mode}.`,
  );
  notifyDbListeners();
  return true;
}

export function recordDraw(input: {
  chit_name: string;
  winner_name: string;
  member_id?: number;
  cycle_month: number;
  payout_amount: number;
  discount_amount?: number;
}) {
  const drawDate = new Date().toISOString().split("T")[0];
  const record: DrawRecord = {
    id: 0,
    chit_name: input.chit_name,
    cycle_month: input.cycle_month,
    winner_name: input.winner_name,
    payout_amount: input.payout_amount,
    discount_amount: input.discount_amount || 0,
    draw_date: drawDate,
  };

  database.withTransactionSync(() => {
    const result = database.runSync(
      `INSERT INTO draws (chit_name, cycle_month, winner_name, payout_amount, discount_amount, draw_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.chit_name,
        record.cycle_month,
        record.winner_name,
        record.payout_amount,
        record.discount_amount,
        record.draw_date,
      ],
    );
    record.id = result.lastInsertRowId;
    if (input.member_id) {
      database.runSync(`UPDATE members SET status = 'Picked' WHERE id = ?`, [
        input.member_id,
      ]);
    } else {
      database.runSync(
        `UPDATE members SET status = 'Picked' WHERE rowid IN (SELECT rowid FROM members WHERE name = ? AND status != 'Picked' LIMIT 1)`,
        [input.winner_name],
      );
    }
  });

  logAuditEvent(
    "RECORD_DRAW",
    `Recorded month ${input.cycle_month} draw winner "${input.winner_name}" for ${input.chit_name}`,
  );
  notifyDbListeners();
  return record;
}

export function getDraws(chitName?: string): DrawRecord[] {
  if (!chitName) {
    return database.getAllSync(
      "SELECT * FROM draws ORDER BY id DESC",
    ) as unknown as DrawRecord[];
  }
  return database.getAllSync(
    "SELECT * FROM draws WHERE chit_name = ? ORDER BY id DESC",
    [chitName],
  ) as unknown as DrawRecord[];
}

export function getAuditEvents(): AuditEventRecord[] {
  return database.getAllSync(
    "SELECT * FROM audit_events ORDER BY id DESC",
  ) as unknown as AuditEventRecord[];
}

export function closeChit(chitId: number) {
  const chit = getChitById(chitId);
  if (!chit) return null;

  database.withTransactionSync(() => {
    database.runSync(`UPDATE chits SET status = 'closed' WHERE id = ?`, [
      chitId,
    ]);
    database.runSync(
      `UPDATE members SET chit_name = ? WHERE LOWER(chit_name) = ?`,
      [`${chit.name} (Closed)`, chit.name.toLowerCase()],
    );
  });

  logAuditEvent(
    "CLOSE_CHIT",
    `Closed chit group "${chit.name}". All member records are permanently preserved in the master directory.`,
  );
  notifyDbListeners();
  return getChits();
}

export function deleteChit(chitId: number) {
  const chit = getChitById(chitId);
  if (!chit) return false;

  database.withTransactionSync(() => {
    database.runSync("DELETE FROM payments WHERE LOWER(chit_name) = ?", [
      chit.name.toLowerCase(),
    ]);
    database.runSync("DELETE FROM draws WHERE LOWER(chit_name) = ?", [
      chit.name.toLowerCase(),
    ]);
    database.runSync(
      "UPDATE members SET chit_name = 'Unassigned' WHERE LOWER(chit_name) IN (?, ?)",
      [chit.name.toLowerCase(), `${chit.name} (closed)`.toLowerCase()],
    );
    database.runSync("DELETE FROM chits WHERE id = ?", [chitId]);
  });

  logAuditEvent(
    "DELETE_CHIT",
    `Deleted chit group "${chit.name}" and its payment and draw history.`,
  );
  notifyDbListeners();
  return true;
}

type AppSettings = {
  reminder_template: string;
  receipt_template: string;
  language: "en" | "te";
};

function readAppSettings(): AppSettings {
  const value = database.getFirstSync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    ["app_settings"],
  )?.value;
  if (!value) {
    return {
      reminder_template: defaultReminderTemplate,
      receipt_template: defaultReceiptTemplate,
      language: "en",
    };
  }
  const parsed: unknown = JSON.parse(value);
  if (!isRecord(parsed)) {
    throw new Error("Saved app settings are invalid.");
  }
  return {
    reminder_template:
      typeof parsed.reminder_template === "string"
        ? parsed.reminder_template
        : defaultReminderTemplate,
    receipt_template:
      typeof parsed.receipt_template === "string"
        ? parsed.receipt_template
        : defaultReceiptTemplate,
    language: parsed.language === "te" ? "te" : "en",
  };
}

function updateAppSettings(update: Partial<AppSettings>) {
  const settings = { ...readAppSettings(), ...update };
  database.runSync(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
    ["app_settings", JSON.stringify(settings)],
  );
  return settings;
}

export function getAppLanguage(): "en" | "te" {
  return readAppSettings().language;
}

export function setAppLanguage(lang: "en" | "te") {
  updateAppSettings({ language: lang });
  logAuditEvent(
    "UPDATE_LANGUAGE",
    `Changed app language to ${lang === "te" ? "Telugu (తెలుగు)" : "English"}`,
  );
  notifyDbListeners();
}

export function getGlobalTemplates() {
  const { reminder_template, receipt_template } = readAppSettings();
  return { reminder_template, receipt_template };
}

export function updateGlobalTemplates(reminder: string, receipt: string) {
  updateAppSettings({
    reminder_template: reminder.trim() || defaultReminderTemplate,
    receipt_template: receipt.trim() || defaultReceiptTemplate,
  });
  logAuditEvent(
    "UPDATE_TEMPLATES",
    "Updated global WhatsApp message templates in Settings",
  );
  notifyDbListeners();
}

export function generateWhatsAppReminderMessage(
  member: { name: string; chit_name: string },
  dueAmount: string,
  customTemplate?: string,
  currentMonth?: number,
  duration?: number,
) {
  const template =
    customTemplate?.trim() ||
    readAppSettings().reminder_template ||
    defaultReminderTemplate;

  const monthLabel =
    currentMonth === undefined
      ? ""
      : duration === undefined
        ? String(currentMonth)
        : `${currentMonth} of ${duration}`;
  const message = template
    .replace(/{name}/g, member.name)
    .replace(/{chit}/g, member.chit_name)
    .replace(/{due}/g, dueAmount)
    .replace(/{month}/g, monthLabel);

  return currentMonth === undefined || template.includes("{month}")
    ? message
    : `${message}\nCurrent chit month: ${monthLabel}`;
}

export function generateWhatsAppReceiptMessage(
  member: { name: string; chit_name: string },
  amount: string,
  mode?: string,
  customTemplate?: string,
  currentMonth?: number,
  duration?: number,
) {
  const template =
    customTemplate?.trim() ||
    readAppSettings().receipt_template ||
    defaultReceiptTemplate;

  const monthLabel =
    currentMonth === undefined
      ? ""
      : duration === undefined
        ? String(currentMonth)
        : `${currentMonth} of ${duration}`;
  const message = template
    .replace(/{name}/g, member.name)
    .replace(/{chit}/g, member.chit_name)
    .replace(/{due}/g, amount)
    .replace(/{mode}/g, mode || "Cash")
    .replace(/{month}/g, monthLabel);

  return currentMonth === undefined || template.includes("{month}")
    ? message
    : `${message}\nCurrent chit month: ${monthLabel}`;
}
