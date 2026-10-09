export type SupportedLanguage = "en" | "te";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const supportedLanguages: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation & Common
    home: "Home",
    logs: "Logs",
    members: "Members",
    settings: "Settings",
    back: "← Back",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    active: "Active",
    picked: "Picked",
    closed: "Closed",
    status: "Status",
    date: "Date",
    total: "Total",
    search: "Search",
    all: "All",
    na: "N/A",
    actions: "Actions",

    // Home Screen
    appTitle: "Chit Manager",
    activeChits: "Active Chit Groups",
    totalDue: "Total Dues",
    collected: "Collected",
    pending: "Pending",
    noChits: "No chit groups found. Create a new chit group to start.",
    createNewChit: "+ New Chit Group",
    viewDetails: "View Details",
    totalValueLabel: "Total Value",
    membersCountLabel: "Members",
    currentMonthLabel: "Month",

    // Chit Detail Screen
    totalValue: "Total Value",
    currentMonth: "Current Month",
    beforePickDue: "Before Pick Due",
    afterPickDue: "After Pick Due",
    startDate: "Start Date",
    membersAndDues: "Members & Payment Dues",
    addMember: "+ Add Member",
    noMembers: 'No members assigned to this chit yet. Tap "+ Add Member".',
    drawHistory: "Draw History",
    noDraws: "No draws recorded yet for this chit.",
    remind: "Remind",
    receipt: "Receipt",
    draw: "Draw",
    closeGroup: "Close Group",
    closeConfirmTitle: "Close Chit Group",
    closeConfirmBody:
      "Are you sure you want to close this group? All member records will remain preserved in your directory.",
    deleteChit: "Delete Chit",
    deleteChitConfirmTitle: "Delete Chit Group",
    deleteChitConfirmBody:
      "This permanently removes the chit, its payment records, and draw history. Members will remain in your directory as unassigned.",

    // Members Screen & Add Member
    memberDirectory: "Member Directory",
    totalMembers: "Total Members",
    searchPlaceholder: "Search by name or phone...",
    filterAll: "All Members",
    filterHasChit: "In Active Chit",
    filterNoChit: "Unassigned",
    addNewMember: "+ Add New Member",
    memberName: "Member Name",
    phoneNumber: "Phone Number",
    address: "Address / Location",
    selectChitGroup: "Assign Chit Group (Optional)",
    saveMember: "Save Member",
    noMembersFound: "No member records found.",
    deleteMember: "Delete Member",
    deleteMemberConfirmTitle: "Delete Member",
    deleteMemberConfirmMessage:
      "Delete {name} from the member directory? Their payment history will be retained.",
    deleteMemberFailedTitle: "Unable to delete member",
    deleteMemberFailedMessage: "Please try again.",
    memberNotFound: "Member not found.",
    editMember: "Edit Member",
    updateMember: "Update Member",
    memberNameRequired: "Enter a member name.",
    memberNameAlreadyExists: "A member with this name already exists.",
    memberUpdateFailed: "Could not update member. Please try again.",
    paidSoFar: "Paid so far",
    paymentMode: "Payment mode",
    recordPayment: "Record payment",
    amountMustBeWithinDue: "Enter an amount between 0 and {due}.",
    paymentUpdateFailed: "Could not update payment. Please try again.",
    contactsPermissionRequiredTitle: "Contacts permission required",
    contactsPermissionRequiredMessage:
      "Allow Chitzz to access your contacts in app settings. Return to this screen and tap Choose from phone contacts again.",
    contactsUnavailableTitle: "Contacts unavailable",
    contactsUnavailableMessage:
      "Use a native build to choose from phone contacts, or enter the member details manually.",
    contactsSettingsUnavailableTitle: "Settings unavailable",
    contactsSettingsUnavailableMessage:
      "Could not open app settings. Open your device settings and allow Chitzz to access contacts.",
    openSettings: "Open Settings",

    // New Chit Screen
    createNewChitTitle: "Create New Chit Group",
    groupName: "Chit Group Name",
    totalChitValue: "Total Chit Value (₹)",
    numberOfMembers: "Total Members",
    durationMonths: "Duration (Months)",
    firstMonthPayout: "First Month Payout Amount (₹)",
    monthlyIncrement: "Monthly Payout Increment (₹)",
    createGroupBtn: "Create Chit Group",

    // Record Draw Screen
    recordDrawTitle: "Record Monthly Draw",
    selectWinner: "Select Winning Member",
    cycleMonth: "Cycle Month",
    payoutAmount: "Payout Amount (₹)",
    drawDate: "Draw Date",
    recordDrawBtn: "Confirm & Save Draw",
    autoCalculatedHint:
      "Payout amount auto-calculated based on month payout formula.",

    // Settings Screen
    settingsTitle: "Settings & Config",
    appLanguage: "App Language / భాష",
    appConfig: "App Configuration",
    currencyStandard: "Currency Standard",
    paymentMethods: "Payment Methods Supported",
    whatsappTemplates: "WhatsApp Message Templates",
    reminderTemplate: "Payment Reminder Template",
    receiptTemplate: "Payment Receipt Template",
    saveTemplates: "Save Message Templates",
    chitsInflowOutflow: "Chits Inflow & Outflow Reconciliation",
    dataManagement: "Data Management",
    clearAllData: "Clear All App Data (Reset to 0)",
    systemSecurity: "System & Security",
    auditActivityLog: "View Audit Activity Log",

    // Payment Statuses & Modes
    pendingStatus: "Pending",
    partialStatus: "Partial",
    paidStatus: "Paid",
    cashMode: "Cash",
    upiMode: "UPI",

    // Audit Logs
    auditLogTitle: "Audit Activity Log",
    noLogs: "No log entries recorded yet.",
  },

  te: {
    // Navigation & Common
    home: "హోమ్",
    logs: "లాగ్స్",
    members: "సభ్యులు",
    settings: "సెట్టింగ్స్",
    back: "← వెనుకకు",
    save: "సేవ్ చేయండి",
    cancel: "రద్దు చేయండి",
    close: "మూసివేయండి",
    active: "యాక్టివ్",
    picked: "ఎంపికయ్యారు",
    closed: "పూర్తయినది",
    status: "స్థితి",
    date: "తేదీ",
    total: "మొత్తం",
    search: "వెతకండి",
    all: "అన్నీ",
    na: "వర్తించదు",
    actions: "చర్యలు",

    // Home Screen
    appTitle: "చిట్ ఫండ్స్ నిర్వహణ",
    activeChits: "యాక్టివ్ చిట్ గ్రూపులు",
    totalDue: "మొత్తం బాకీలు",
    collected: "వసూలైనవి",
    pending: "బాకీ ఉన్నవి",
    noChits:
      "చిట్ గ్రూపులు ఏవీ లేవు. ప్రారంభించడానికి కొత్త చిట్ గ్రూప్ నిర్మించండి.",
    createNewChit: "+ కొత్త చిట్ గ్రూప్",
    viewDetails: "వివరాలు చూడండి",
    totalValueLabel: "మొత్తం విలువ",
    membersCountLabel: "సభ్యులు",
    currentMonthLabel: "నెల",

    // Chit Detail Screen
    totalValue: "మొత్తం విలువ",
    currentMonth: "ప్రస్తుత నెల",
    beforePickDue: "పాట పాడకముందు బాకీ",
    afterPickDue: "పాట పాడినతర్వాత బాకీ",
    startDate: "ప్రారంభ తేదీ",
    membersAndDues: "సభ్యులు & చెల్లింపు బాకీలు",
    addMember: "+ సభ్యుడిని జతచేయండి",
    noMembers: 'ఈ చిట్‌లో సభ్యులు ఎవరూ లేరు. "+ సభ్యుడిని జతచేయండి" నొక్కండి.',
    drawHistory: "డ్రా చరిత్ర",
    noDraws: "ఈ చిట్‌లో ఇంకా డ్రాలు నమోదు కాలేదు.",
    remind: "జ్ఞాపకం చేయి",
    receipt: "రసీదు",
    draw: "డ్రా",
    closeGroup: "గ్రూప్ మూసివేయి",
    closeConfirmTitle: "చిట్ గ్రూప్ మూసివేయి",
    closeConfirmBody:
      "మీరు ఖచ్చితంగా ఈ గ్రూప్‌ను మూసివేయాలనుకుంటున్నారా? సభ్యుల వివరాలు మీ డైరెక్టరీలో భద్రంగా ఉంటాయి.",
    deleteChit: "చిట్ తొలగించండి",
    deleteChitConfirmTitle: "చిట్ గ్రూప్ తొలగించండి",
    deleteChitConfirmBody:
      "చిట్, దాని చెల్లింపు వివరాలు మరియు డ్రా చరిత్ర శాశ్వతంగా తొలగించబడతాయి. సభ్యులు కేటాయించని వారిగా డైరెక్టరీలో ఉంటారు.",

    // Members Screen & Add Member
    memberDirectory: "సభ్యుల డైరెక్టరీ",
    totalMembers: "మొత్తం సభ్యులు",
    searchPlaceholder: "పేరు లేదా ఫోన్ నంబర్ ద్వారా వెతకండి...",
    filterAll: "అందరూ సభ్యులు",
    filterHasChit: "యాక్టివ్ చిట్‌లో ఉన్నారు",
    filterNoChit: "చిట్‌ కేటాయించలేదు",
    addNewMember: "+ కొత్త సభ్యుడిని చేర్చండి",
    memberName: "సభ్యుని పేరు",
    phoneNumber: "ఫోన్ నంబర్",
    address: "చిరునామా / ప్రాంతం",
    selectChitGroup: "చిట్ గ్రూప్ కేటాయించండి (ఐచ్ఛికం)",
    saveMember: "సభ్యుడిని సేవ్ చేయండి",
    noMembersFound: "సభ్యుల వివరాలు ఏవీ కనుగొనబడలేదు.",
    deleteMember: "సభ్యుడిని తొలగించండి",
    deleteMemberConfirmTitle: "సభ్యుడిని తొలగించండి",
    deleteMemberConfirmMessage:
      "{name}ను సభ్యుల డైరెక్టరీ నుంచి తొలగించాలా? వారి చెల్లింపు చరిత్ర అలాగే ఉంటుంది.",
    deleteMemberFailedTitle: "సభ్యుడిని తొలగించలేకపోయాం",
    deleteMemberFailedMessage: "దయచేసి మళ్లీ ప్రయత్నించండి.",
    memberNotFound: "సభ్యుడు కనుగొనబడలేదు.",
    editMember: "సభ్యుడి వివరాలు మార్చండి",
    updateMember: "సభ్యుడిని నవీకరించండి",
    memberNameRequired: "సభ్యుని పేరు నమోదు చేయండి.",
    memberNameAlreadyExists: "ఈ పేరుతో ఒక సభ్యుడు ఇప్పటికే ఉన్నారు.",
    memberUpdateFailed: "సభ్యుడి వివరాలను నవీకరించలేకపోయాం. మళ్లీ ప్రయత్నించండి.",
    paidSoFar: "ఇప్పటివరకు చెల్లించినది",
    paymentMode: "చెల్లింపు విధానం",
    recordPayment: "చెల్లింపును నమోదు చేయండి",
    amountMustBeWithinDue: "0 నుంచి {due} మధ్య మొత్తాన్ని నమోదు చేయండి.",
    paymentUpdateFailed: "చెల్లింపును నవీకరించలేకపోయాం. మళ్లీ ప్రయత్నించండి.",
    contactsPermissionRequiredTitle: "కాంటాక్ట్‌ల అనుమతి అవసరం",
    contactsPermissionRequiredMessage:
      "యాప్ సెట్టింగ్‌లలో Chitzz‌కు కాంటాక్ట్‌ల అనుమతి ఇవ్వండి. తర్వాత ఈ స్క్రీన్‌కు తిరిగి వచ్చి ఫోన్ కాంటాక్ట్‌ల నుంచి ఎంచుకోండి.",
    contactsUnavailableTitle: "కాంటాక్ట్‌లు అందుబాటులో లేవు",
    contactsUnavailableMessage:
      "ఫోన్ కాంటాక్ట్‌ల నుంచి ఎంచుకోవడానికి నేటివ్ బిల్డ్ ఉపయోగించండి లేదా సభ్యుని వివరాలను మాన్యువల్‌గా నమోదు చేయండి.",
    contactsSettingsUnavailableTitle: "సెట్టింగ్‌లు తెరవలేకపోయాం",
    contactsSettingsUnavailableMessage:
      "యాప్ సెట్టింగ్‌లు తెరవడం సాధ్యం కాలేదు. పరికర సెట్టింగ్‌లలో Chitzz‌కు కాంటాక్ట్‌ల అనుమతి ఇవ్వండి.",
    openSettings: "సెట్టింగ్‌లు తెరవండి",

    // New Chit Screen
    createNewChitTitle: "కొత్త చిట్ గ్రూప్ సృష్టించండి",
    groupName: "చిట్ గ్రూప్ పేరు",
    totalChitValue: "మొత్తం చిట్ విలువ (₹)",
    numberOfMembers: "మొత్తం సభ్యుల సంఖ్య",
    durationMonths: "వ్యవధి (నెలలు)",
    firstMonthPayout: "మొదటి నెల చెల్లింపు మొత్తం (₹)",
    monthlyIncrement: "నెలకు పెరుగుదల మొత్తం (₹)",
    createGroupBtn: "చిట్ గ్రూప్‌ను సృష్టించండి",

    // Record Draw Screen
    recordDrawTitle: "నెలవారీ డ్రా నమోదు",
    selectWinner: "పాట పాడిన సభ్యుడిని ఎంచుకోండి",
    cycleMonth: "డ్రా నెల",
    payoutAmount: "చెల్లింపు మొత్తం (₹)",
    drawDate: "డ్రా తేదీ",
    recordDrawBtn: "డ్రా నిర్ధారించి సేవ్ చేయండి",
    autoCalculatedHint:
      "చెల్లింపు మొత్తం ఫార్ములా ప్రకారం ఆటోమేటిక్‌గా లెక్కించబడింది.",

    // Settings Screen
    settingsTitle: "సెట్టింగ్స్ & కాన్ఫిగరేషన్",
    appLanguage: "యాప్ భాష / Language",
    appConfig: "యాప్ సమాచారం",
    currencyStandard: "కరెన్సీ రకం",
    paymentMethods: "మద్దతు ఇచ్చే చెల్లింపు పద్ధతులు",
    whatsappTemplates: "వాట్సాప్ మెసేజ్ టెంప్లేట్‌లు",
    reminderTemplate: "చెల్లింపు జ్ఞాపకార్ధ మెసేజ్",
    receiptTemplate: "చెల్లింపు రసీదు మెసేజ్",
    saveTemplates: "టెంప్లేట్‌లను సేవ్ చేయండి",
    chitsInflowOutflow: "చిట్ల నగదు రాబడి & చెల్లింపుల నివేదిక",
    dataManagement: "డేటా నిర్వహణ",
    clearAllData: "యాప్ డేటా మొత్తం తొలగించండి (0 కు రీసెట్)",
    systemSecurity: "సిస్టమ్ & సెక్యూరిటీ",
    auditActivityLog: "ఆడిట్ లాగ్ వివరాలు చూడండి",

    // Payment Statuses & Modes
    pendingStatus: "బాకీ ఉంది",
    partialStatus: "కొంత భాగం",
    paidStatus: "చెల్లించారు",
    cashMode: "నగదు",
    upiMode: "UPI",

    // Audit Logs
    auditLogTitle: "ఆడిట్ యాక్టివిటీ లాగ్",
    noLogs: "ఎటువంటి లాగ్ నమోదు కాలేదు.",
  },
};
