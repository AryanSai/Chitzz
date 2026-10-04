type SQLiteLike = {
  openDatabaseSync: (name: string) => {
    execSync: (sql: string) => void;
    getFirstSync: (
      sql: string,
      params?: unknown[],
    ) => Record<string, unknown> | null;
    runSync: (sql: string, params?: unknown[]) => void;
    getAllSync: (sql: string, params?: unknown[]) => Record<string, unknown>[];
  };
};

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

export const parseCurrency = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned || "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

const listeners = new Set<() => void>();

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

const fallbackState = {
  chits: [] as ChitRecord[],
  members: [] as MemberRecord[],
  payments: [] as PaymentRecord[],
  draws: [] as DrawRecord[],
  auditEvents: [] as AuditEventRecord[],
};

const webStorageKey = "chitzz-data-v1";

try {
  if (typeof localStorage !== "undefined") {
    const savedState = localStorage.getItem(webStorageKey);
    if (savedState) Object.assign(fallbackState, JSON.parse(savedState));
  }
} catch (error) {
  console.warn("Unable to load saved browser data.", error);
}

function persistFallbackState() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(webStorageKey, JSON.stringify(fallbackState));
    }
  } catch (error) {
    console.warn("Unable to persist browser data.", error);
  }
}

export function clearAllData() {
  fallbackState.chits = [];
  fallbackState.members = [];
  fallbackState.payments = [];
  fallbackState.draws = [];
  fallbackState.auditEvents = [];
  persistFallbackState();
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
    name: "Rajesh Sharma",
    phone: "+91 98765 43210",
    chit_name: "Diwali Savings 2026",
    status: "Active",
    tickets: 1,
  });

  createMember({
    name: "Priya Patel",
    phone: "+91 98123 45678",
    chit_name: "Diwali Savings 2026",
    status: "Picked",
    tickets: 1,
  });

  createMember({
    name: "Amit Verma",
    phone: "+91 97111 22233",
    chit_name: "Gold Club Chit",
    status: "Active",
    tickets: 2,
  });

  createMember({
    name: "Anand Arvapelly",
    phone: "+91 92999 97199",
    chit_name: "Unassigned",
    status: "Active",
    tickets: 1,
  });

  logAuditEvent("SEED_DATA", "Loaded sample demo data for testing.");
  notifyDbListeners();
}

export function logAuditEvent(action: string, details: string) {
  const timestamp = new Date().toISOString();
  const event: AuditEventRecord = {
    id: Date.now(),
    action,
    details,
    timestamp,
  };
  fallbackState.auditEvents.unshift(event);
  persistFallbackState();
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
    .filter((row) => row.status === "Paid")
    .reduce((sum, row) => sum + parseCurrency(row.due), 0);
  const partial = paymentRows
    .filter((row) => row.status === "Partially paid")
    .reduce((sum, row) => sum + parseCurrency(row.due) * 0.5, 0);
  const nextChit = chits[0]?.name ?? "No active chit";

  return {
    dueThisMonth: totalDue,
    received: collected + partial,
    pendingMembers,
    nextChit,
  };
}

export function getChits(): ChitRecord[] {
  return fallbackState.chits;
}

export function getChitById(id: number): ChitRecord | undefined {
  return fallbackState.chits.find((c) => c.id === id);
}

export function getChitByName(name: string): ChitRecord | undefined {
  return fallbackState.chits.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
}

export function getMembers(): MemberRecord[] {
  return fallbackState.members;
}

export function getMemberById(id: number): MemberRecord | undefined {
  return fallbackState.members.find((m) => m.id === id);
}

export function getMembersByChit(chitName: string): MemberRecord[] {
  if (!chitName || chitName === "All") return fallbackState.members;
  return fallbackState.members.filter(
    (m) => m.chit_name.toLowerCase() === chitName.toLowerCase(),
  );
}

export function getPaymentRows(): PaymentRecord[] {
  return fallbackState.payments;
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
        (row.status === "Paid" || row.status === "Partially paid") &&
        (row.mode === "Cash" || !row.mode),
    )
    .reduce(
      (sum, row) =>
        sum +
        (row.status === "Paid"
          ? parseCurrency(row.due)
          : parseCurrency(row.due) * 0.5),
      0,
    );

  const upiCollected = paymentRows
    .filter(
      (row) =>
        (row.status === "Paid" || row.status === "Partially paid") &&
        row.mode === "UPI",
    )
    .reduce(
      (sum, row) =>
        sum +
        (row.status === "Paid"
          ? parseCurrency(row.due)
          : parseCurrency(row.due) * 0.5),
      0,
    );

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
    id: Date.now(),
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

  fallbackState.chits.unshift(record);

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
  const chit = fallbackState.chits.find((c) => c.id === chitId);
  if (chit) {
    chit.reminder_template = reminderTemplate.trim();
    chit.receipt_template = receiptTemplate.trim();
  }
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

  for (let i = 0; i < ticketCount; i++) {
    const memberName =
      ticketCount > 1 ? `${input.name.trim()} (T${i + 1})` : input.name.trim();
    const record: MemberRecord = {
      id: Date.now() + i,
      name: memberName,
      phone: finalPhone,
      chit_name: finalChitName,
      status: input.status,
    };

    const chit = getChitByName(finalChitName);
    const dueAmount = chit
      ? input.status === "Picked"
        ? chit.after_pick
        : chit.before_pick
      : 0;

    fallbackState.members.unshift(record);
    if (finalChitName !== "Unassigned" && dueAmount > 0) {
      fallbackState.payments.unshift({
        id: Date.now() + i + 1000,
        member: record.name,
        due: asCurrency(dueAmount),
        status: "Pending",
        mode: "Cash",
        chit_name: record.chit_name,
      });
    }
    createdMembers.push(record);
  }

  logAuditEvent(
    "CREATE_MEMBER",
    ticketCount > 1
      ? `Added ${ticketCount} tickets for member "${input.name}" to chit "${finalChitName}"`
      : `Added member "${input.name}" to chit "${finalChitName}"`,
  );
  notifyDbListeners();
  return createdMembers[0];
}

export function updatePaymentStatus(
  idOrMember: number | string,
  status: "Pending" | "Partially paid" | "Paid",
  mode: PaymentMode = "Cash",
) {
  const payment =
    typeof idOrMember === "number"
      ? fallbackState.payments.find((row) => row.id === idOrMember)
      : fallbackState.payments.find((row) => row.member === idOrMember);

  if (payment) {
    payment.status = status;
    payment.mode = mode;
  }

  logAuditEvent(
    "UPDATE_PAYMENT",
    `Updated payment status to "${status}" via ${mode}`,
  );
  notifyDbListeners();
  return getPaymentRows();
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
    id: Date.now(),
    chit_name: input.chit_name,
    cycle_month: input.cycle_month,
    winner_name: input.winner_name,
    payout_amount: input.payout_amount,
    discount_amount: input.discount_amount || 0,
    draw_date: drawDate,
  };

  fallbackState.draws.unshift(record);
  const member = input.member_id
    ? fallbackState.members.find((m) => m.id === input.member_id)
    : fallbackState.members.find(
        (m) => m.name === input.winner_name && m.status !== "Picked",
      );
  if (member) member.status = "Picked";

  logAuditEvent(
    "RECORD_DRAW",
    `Recorded month ${input.cycle_month} draw winner "${input.winner_name}" for ${input.chit_name}`,
  );
  notifyDbListeners();
  return record;
}

export function getDraws(chitName?: string): DrawRecord[] {
  if (!chitName) return fallbackState.draws;
  return fallbackState.draws.filter(
    (d) => d.chit_name.toLowerCase() === chitName.toLowerCase(),
  );
}

export function getAuditEvents(): AuditEventRecord[] {
  return fallbackState.auditEvents;
}

export function closeChit(chitId: number) {
  const chit = getChitById(chitId);
  if (!chit) return null;

  const item = fallbackState.chits.find((c) => c.id === chitId);
  if (item) item.status = "closed";
  fallbackState.members.forEach((m) => {
    if (m.chit_name.toLowerCase() === chit.name.toLowerCase()) {
      m.chit_name = `${chit.name} (Closed)`;
    }
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

  fallbackState.chits = fallbackState.chits.filter(
    (item) => item.id !== chitId,
  );
  fallbackState.payments = fallbackState.payments.filter(
    (payment) => payment.chit_name?.toLowerCase() !== chit.name.toLowerCase(),
  );
  fallbackState.draws = fallbackState.draws.filter(
    (draw) => draw.chit_name.toLowerCase() !== chit.name.toLowerCase(),
  );
  fallbackState.members.forEach((member) => {
    if (
      member.chit_name.toLowerCase() === chit.name.toLowerCase() ||
      member.chit_name.toLowerCase() === `${chit.name} (closed)`.toLowerCase()
    ) {
      member.chit_name = "Unassigned";
    }
  });

  logAuditEvent(
    "DELETE_CHIT",
    `Deleted chit group "${chit.name}" and its payment and draw history.`,
  );
  notifyDbListeners();
  return true;
}

const defaultReminderTemplate =
  "Hello {name}, this is a gentle payment reminder for your chit contribution ({chit}). Amount due: {due}. Please settle at your earliest convenience. Thank you!";
const defaultReceiptTemplate =
  "Payment Receipt: Received {due} from {name} for chit ({chit}) via {mode}. Status: Confirmed. Thank you for your timely payment!";

const appSettings = {
  reminder_template: defaultReminderTemplate,
  receipt_template: defaultReceiptTemplate,
  language: "en" as "en" | "te",
};

try {
  if (typeof localStorage !== "undefined") {
    const savedSettings = localStorage.getItem("chitzz-settings-v1");
    if (savedSettings) Object.assign(appSettings, JSON.parse(savedSettings));
  }
} catch (error) {
  console.warn("Unable to load saved browser settings.", error);
}

function persistAppSettings() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("chitzz-settings-v1", JSON.stringify(appSettings));
    }
  } catch (error) {
    console.warn("Unable to persist browser settings.", error);
  }
}

export function getAppLanguage(): "en" | "te" {
  return appSettings.language;
}

export function setAppLanguage(lang: "en" | "te") {
  appSettings.language = lang;
  persistAppSettings();
  logAuditEvent(
    "UPDATE_LANGUAGE",
    `Changed app language to ${lang === "te" ? "Telugu (తెలుగు)" : "English"}`,
  );
  notifyDbListeners();
}

export function getGlobalTemplates() {
  return appSettings;
}

export function updateGlobalTemplates(reminder: string, receipt: string) {
  appSettings.reminder_template = reminder.trim() || defaultReminderTemplate;
  appSettings.receipt_template = receipt.trim() || defaultReceiptTemplate;
  persistAppSettings();
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
    appSettings.reminder_template ||
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
    appSettings.receipt_template ||
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
