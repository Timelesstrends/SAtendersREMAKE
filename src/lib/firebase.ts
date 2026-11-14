import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CompanyProfile,
  TenderOpportunity,
  CommercialDocument,
  Employee,
  EmailLogEntry,
  PopiaConsentRecord
} from '../types';

export const CURRENT_TOS_VERSION = '2026.11-ZA';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Required Connection Validation at Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Firestore client is offline.');
    }
  }
}
testConnection();

// Sanitize arbitrary objects so Firestore never receives `undefined` values
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id-${Date.now()}`;
}

export async function signInWithGoogleCloud(rememberMe = true): Promise<User> {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebaseCloud(): Promise<void> {
  await signOut(auth);
}

export function listenToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export interface WorkspaceBootstrapResult {
  companyId: string;
  inviteCode: string;
  accessLevel: Employee['accessLevel'];
  role: string;
  companyProfile?: CompanyProfile;
  popiaConsent: PopiaConsentRecord;
  isNewWorkspace: boolean;
}

export async function lookupInviteCode(inviteCodeInput: string): Promise<{
  companyId: string;
  companyName: string;
  inviteCode: string;
} | null> {
  const code = sanitizeId(inviteCodeInput.trim().toUpperCase());
  const path = `inviteDirectory/${code}`;
  try {
    const snap = await getDoc(doc(db, 'inviteDirectory', code));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      companyId: String(data.companyId),
      companyName: String(data.companyName),
      inviteCode: String(data.inviteCode)
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function bootstrapOrJoinWorkspace(params: {
  user: User;
  defaultProfile: CompanyProfile;
  defaultTenders: TenderOpportunity[];
  defaultDocs: CommercialDocument[];
  joinInviteCode?: string;
  customCompanyName?: string;
  requestedRole?: string;
  requestedAccessLevel?: Employee['accessLevel'];
  popiaAccepted: boolean;
}): Promise<WorkspaceBootstrapResult> {
  const {
    user,
    defaultProfile,
    defaultTenders,
    defaultDocs,
    joinInviteCode,
    customCompanyName,
    requestedRole,
    requestedAccessLevel,
    popiaAccepted
  } = params;

  const uid = sanitizeId(user.uid);
  const email = (user.email || 'user@company.co.za').slice(0, 200);
  const displayName = (user.displayName || email.split('@')[0] || 'Team Specialist').slice(0, 120);
  const nowIso = new Date().toISOString();

  // Check if user already belongs to a workspace
  const userPath = `users/${uid}`;
  let existingUserData: any = null;
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      existingUserData = userSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  // Case A: User explicitly wants to join an existing company via Invite Code
  if (joinInviteCode && joinInviteCode.trim().length >= 4) {
    const invite = await lookupInviteCode(joinInviteCode);
    if (!invite) {
      throw new Error(`Invalid Company Invite Code "${joinInviteCode.trim().toUpperCase()}". Please verify the code with your Company Admin.`);
    }

    const memberRole = (requestedRole || 'Bid Manager & Estimator').slice(0, 120);
    // Security invariant: Joining employees cannot self-assign ADMIN
    const safeAccessLevel: Employee['accessLevel'] =
      requestedAccessLevel && requestedAccessLevel !== 'ADMIN'
        ? requestedAccessLevel
        : 'BID_MANAGER';

    const memberPath = `companies/${invite.companyId}/members/${uid}`;
    try {
      await setDoc(
        doc(db, 'companies', invite.companyId, 'members', uid),
        stripUndefined({
          uid,
          companyId: invite.companyId,
          name: displayName,
          email,
          role: memberRole,
          accessLevel: safeAccessLevel,
          active: true,
          inviteCode: invite.inviteCode,
          joinedAt: nowIso
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, memberPath);
    }

    const consent: PopiaConsentRecord = {
      accepted: true,
      tosVersion: CURRENT_TOS_VERSION,
      acceptedAt: nowIso,
      acceptedByEmail: email
    };

    try {
      await setDoc(
        doc(db, 'users', uid),
        stripUndefined({
          uid,
          email,
          displayName,
          companyId: invite.companyId,
          role: memberRole,
          accessLevel: existingUserData?.accessLevel || safeAccessLevel,
          popiaConsentAccepted: true,
          tosAcceptedVersion: CURRENT_TOS_VERSION,
          tosAcceptedAt: nowIso,
          updatedAt: nowIso
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }

    return {
      companyId: invite.companyId,
      inviteCode: invite.inviteCode,
      accessLevel: safeAccessLevel,
      role: memberRole,
      popiaConsent: consent,
      isNewWorkspace: false
    };
  }

  // Case B: Returning user with an existing companyId
  if (existingUserData && existingUserData.companyId) {
    const companyId = sanitizeId(existingUserData.companyId);
    const companyPath = `companies/${companyId}`;
    let companySnapData: any = null;
    try {
      const compSnap = await getDoc(doc(db, 'companies', companyId));
      if (compSnap.exists()) {
        companySnapData = compSnap.data();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, companyPath);
    }

    if (companySnapData) {
      // Refresh user POPIA/updated timestamp if needed
      if (popiaAccepted) {
        try {
          await setDoc(
            doc(db, 'users', uid),
            stripUndefined({
              uid,
              email,
              displayName,
              companyId,
              role: existingUserData.role || 'Authorized Bid Specialist',
              accessLevel: existingUserData.accessLevel || 'ADMIN',
              popiaConsentAccepted: true,
              tosAcceptedVersion: CURRENT_TOS_VERSION,
              tosAcceptedAt: existingUserData.tosAcceptedAt || nowIso,
              updatedAt: nowIso
            })
          );
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, userPath);
        }
      }

      return {
        companyId,
        inviteCode: companySnapData.inviteCode || `SA-${companyId.slice(-6).toUpperCase()}`,
        accessLevel: existingUserData.accessLevel || 'BID_MANAGER',
        role: existingUserData.role || 'Bid Specialist',
        companyProfile: companySnapData.profileJson as CompanyProfile | undefined,
        popiaConsent: {
          accepted: Boolean(existingUserData.popiaConsentAccepted ?? true),
          tosVersion: existingUserData.tosAcceptedVersion || CURRENT_TOS_VERSION,
          acceptedAt: existingUserData.tosAcceptedAt || nowIso,
          acceptedByEmail: email
        },
        isNewWorkspace: false
      };
    }
  }

  // Case C: First-time login creating a new Company Workspace
  const companyId = sanitizeId(`co-${uid.slice(0, 16)}`);
  const inviteCode = sanitizeId(`SA-${uid.slice(0, 6).toUpperCase()}`);
  const legalName = (customCompanyName?.trim() || defaultProfile.legalName || `${displayName} Trading (Pty) Ltd`).slice(0, 200);
  const tradingName = (customCompanyName?.trim() || defaultProfile.tradingName || legalName).slice(0, 200);

  const initialEmployees: Employee[] = [
    {
      id: uid,
      name: displayName,
      email,
      role: requestedRole || 'Managing Director & Lead Bid Specialist',
      accessLevel: 'ADMIN',
      qualifications: ['Registered Procurement Practitioner'],
      yearsExperience: 8,
      hasCV: true
    },
    ...defaultProfile.employees.filter((e) => e.email?.toLowerCase() !== email.toLowerCase())
  ];

  const workspaceProfile: CompanyProfile = {
    ...defaultProfile,
    legalName,
    tradingName,
    companyEmail: defaultProfile.companyEmail || email,
    employees: initialEmployees,
    cloudCompanyId: companyId,
    inviteCode,
    emailNotifications: defaultProfile.emailNotifications || {
      morningBriefingEnabled: true,
      morningBriefingTimeSast: '07:30',
      closing48hAlertEnabled: true,
      recipientEmails: [email],
      preferredProvider: 'postmark'
    }
  };

  // Create root company doc
  const companyPath = `companies/${companyId}`;
  try {
    await setDoc(
      doc(db, 'companies', companyId),
      stripUndefined({
        companyId,
        ownerUid: uid,
        inviteCode,
        legalName,
        tradingName,
        registrationNumber: (workspaceProfile.registrationNumber || '2020/192837/07').slice(0, 64),
        industry: (workspaceProfile.industry || 'General Procurement').slice(0, 120),
        csdNumber: (workspaceProfile.csdNumber || 'MAAA0821439').slice(0, 64),
        bbeeLevel: Number(workspaceProfile.bbeeLevel ?? 1),
        profileJson: workspaceProfile,
        updatedAt: nowIso
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, companyPath);
  }

  // Create invite directory lookup entry
  const invitePath = `inviteDirectory/${inviteCode}`;
  try {
    await setDoc(
      doc(db, 'inviteDirectory', inviteCode),
      stripUndefined({
        inviteCode,
        companyId,
        companyName: tradingName,
        ownerUid: uid,
        updatedAt: nowIso
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, invitePath);
  }

  // Bootstrap Admin membership doc
  const memberPath = `companies/${companyId}/members/${uid}`;
  try {
    await setDoc(
      doc(db, 'companies', companyId, 'members', uid),
      stripUndefined({
        uid,
        companyId,
        name: displayName,
        email,
        role: 'Managing Director & Lead Bid Specialist',
        accessLevel: 'ADMIN',
        active: true,
        joinedAt: nowIso
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, memberPath);
  }

  // Create user account doc with POPIA consent record
  try {
    await setDoc(
      doc(db, 'users', uid),
      stripUndefined({
        uid,
        email,
        displayName,
        companyId,
        role: 'Managing Director & Lead Bid Specialist',
        accessLevel: 'ADMIN',
        popiaConsentAccepted: true,
        tosAcceptedVersion: CURRENT_TOS_VERSION,
        tosAcceptedAt: nowIso,
        updatedAt: nowIso
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  // Seed active pursued tenders & commercial docs into shared company binder
  const activeDefaults = defaultTenders.filter((t) => t.status !== 'DISCOVERED').slice(0, 15);
  try {
    const batch = writeBatch(db);
    for (const tender of activeDefaults) {
      const tid = sanitizeId(tender.id);
      batch.set(
        doc(db, 'companies', companyId, 'tenders', tid),
        stripUndefined({
          id: tid,
          companyId,
          title: (tender.title || 'Public Tender').slice(0, 500),
          buyer: (tender.buyer || 'Organ of State').slice(0, 300),
          status: (tender.status || 'IN_PREPARATION').slice(0, 64),
          closingDate: (tender.closingDate || nowIso).slice(0, 64),
          tenderData: tender,
          updatedByUid: uid,
          updatedByName: displayName,
          updatedAt: nowIso
        })
      );
    }
    for (const cdoc of defaultDocs.slice(0, 10)) {
      const did = sanitizeId(cdoc.id);
      batch.set(
        doc(db, 'companies', companyId, 'commercialDocs', did),
        stripUndefined({
          id: did,
          companyId,
          docNumber: (cdoc.docNumber || did).slice(0, 64),
          type: cdoc.type,
          status: (cdoc.status || 'DRAFT').slice(0, 32),
          docData: cdoc,
          updatedByUid: uid,
          updatedAt: nowIso
        })
      );
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/tenders`);
  }

  return {
    companyId,
    inviteCode,
    accessLevel: 'ADMIN',
    role: 'Managing Director & Lead Bid Specialist',
    companyProfile: workspaceProfile,
    popiaConsent: {
      accepted: true,
      tosVersion: CURRENT_TOS_VERSION,
      acceptedAt: nowIso,
      acceptedByEmail: email
    },
    isNewWorkspace: true
  };
}

export function subscribeToCompanyWorkspace(
  companyIdInput: string,
  handlers: {
    onCompanyProfile: (profile: CompanyProfile, inviteCode: string) => void;
    onMembers: (members: Employee[]) => void;
    onTenders: (cloudTenders: TenderOpportunity[]) => void;
    onCommercialDocs: (docs: CommercialDocument[]) => void;
    onEmailLogs: (logs: EmailLogEntry[]) => void;
  }
): () => void {
  const companyId = sanitizeId(companyIdInput);

  const unsubCompany = onSnapshot(
    doc(db, 'companies', companyId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.profileJson) {
          handlers.onCompanyProfile(
            {
              ...(data.profileJson as CompanyProfile),
              cloudCompanyId: companyId,
              inviteCode: data.inviteCode
            },
            String(data.inviteCode || '')
          );
        }
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, `companies/${companyId}`)
  );

  const unsubMembers = onSnapshot(
    collection(db, 'companies', companyId, 'members'),
    (snap) => {
      const members: Employee[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.uid || d.id),
          name: String(data.name || 'Team Member'),
          email: String(data.email || ''),
          role: String(data.role || 'Bid Specialist'),
          accessLevel: data.accessLevel || 'BID_MANAGER',
          qualifications: ['Cloud Verified Team Member'],
          yearsExperience: 5,
          hasCV: true
        };
      });
      handlers.onMembers(members);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/members`)
  );

  const unsubTenders = onSnapshot(
    collection(db, 'companies', companyId, 'tenders'),
    (snap) => {
      const list: TenderOpportunity[] = snap.docs
        .map((d) => d.data()?.tenderData as TenderOpportunity)
        .filter(Boolean);
      handlers.onTenders(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/tenders`)
  );

  const unsubCommercial = onSnapshot(
    collection(db, 'companies', companyId, 'commercialDocs'),
    (snap) => {
      const list: CommercialDocument[] = snap.docs
        .map((d) => d.data()?.docData as CommercialDocument)
        .filter(Boolean);
      handlers.onCommercialDocs(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/commercialDocs`)
  );

  const unsubEmailLogs = onSnapshot(
    collection(db, 'companies', companyId, 'emailLogs'),
    (snap) => {
      const logs: EmailLogEntry[] = snap.docs
        .map((d) => d.data() as EmailLogEntry)
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      handlers.onEmailLogs(logs);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/emailLogs`)
  );

  return () => {
    unsubCompany();
    unsubMembers();
    unsubTenders();
    unsubCommercial();
    unsubEmailLogs();
  };
}

export async function saveCompanyProfileToCloud(
  companyIdInput: string,
  _ownerUid: string,
  _inviteCode: string,
  profile: CompanyProfile,
  isAdminUser = false
): Promise<void> {
  const companyId = sanitizeId(companyIdInput);
  const path = `companies/${companyId}`;
  const nowIso = new Date().toISOString();
  try {
    const payload = isAdminUser
      ? {
          legalName: (profile.legalName || 'SA Company').slice(0, 200),
          tradingName: (profile.tradingName || profile.legalName || 'SA Company').slice(0, 200),
          registrationNumber: (profile.registrationNumber || '').slice(0, 64),
          industry: (profile.industry || 'General').slice(0, 120),
          csdNumber: (profile.csdNumber || '').slice(0, 64),
          bbeeLevel: Number(profile.bbeeLevel ?? 1),
          profileJson: profile,
          updatedAt: nowIso
        }
      : {
          profileJson: profile,
          updatedAt: nowIso
        };

    await updateDoc(doc(db, 'companies', companyId), stripUndefined(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertTenderToCloud(
  companyIdInput: string,
  tender: TenderOpportunity
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const companyId = sanitizeId(companyIdInput);
  const tenderId = sanitizeId(tender.id);
  const path = `companies/${companyId}/tenders/${tenderId}`;
  const nowIso = new Date().toISOString();

  try {
    await setDoc(
      doc(db, 'companies', companyId, 'tenders', tenderId),
      stripUndefined({
        id: tenderId,
        companyId,
        title: (tender.title || 'Tender Notice').slice(0, 500),
        buyer: (tender.buyer || 'Organ of State').slice(0, 300),
        status: (tender.status || 'DISCOVERED').slice(0, 64),
        closingDate: (tender.closingDate || nowIso).slice(0, 64),
        tenderData: { ...tender, id: tenderId },
        updatedByUid: sanitizeId(uid),
        updatedByName: (auth.currentUser?.displayName || auth.currentUser?.email || 'Team Member').slice(0, 120),
        updatedAt: nowIso
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCommercialDocToCloud(
  companyIdInput: string,
  cdoc: CommercialDocument
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const companyId = sanitizeId(companyIdInput);
  const docId = sanitizeId(cdoc.id);
  const path = `companies/${companyId}/commercialDocs/${docId}`;
  const nowIso = new Date().toISOString();

  try {
    await setDoc(
      doc(db, 'companies', companyId, 'commercialDocs', docId),
      stripUndefined({
        id: docId,
        companyId,
        docNumber: (cdoc.docNumber || docId).slice(0, 64),
        type: cdoc.type,
        status: (cdoc.status || 'DRAFT').slice(0, 32),
        docData: { ...cdoc, id: docId },
        updatedByUid: sanitizeId(uid),
        updatedAt: nowIso
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateMemberRoleInCloud(
  companyIdInput: string,
  member: Employee
): Promise<void> {
  const companyId = sanitizeId(companyIdInput);
  const memberUid = sanitizeId(member.id);
  const path = `companies/${companyId}/members/${memberUid}`;
  const ref = doc(db, 'companies', companyId, 'members', memberUid);
  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(
        ref,
        stripUndefined({
          name: member.name.slice(0, 120),
          role: member.role.slice(0, 120),
          accessLevel: member.accessLevel || 'BID_MANAGER',
          active: true
        })
      );
    } else {
      await setDoc(
        ref,
        stripUndefined({
          uid: memberUid,
          companyId,
          name: member.name.slice(0, 120),
          email: (member.email || 'member@company.co.za').slice(0, 200),
          role: member.role.slice(0, 120),
          accessLevel: member.accessLevel || 'BID_MANAGER',
          active: true
        })
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordEmailLogInCloud(
  companyIdInput: string,
  logEntry: Omit<EmailLogEntry, 'companyId' | 'createdByUid'>
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const companyId = sanitizeId(companyIdInput);
  const logId = sanitizeId(logEntry.id);
  const path = `companies/${companyId}/emailLogs/${logId}`;
  try {
    await setDoc(
      doc(db, 'companies', companyId, 'emailLogs', logId),
      stripUndefined({
        id: logId,
        companyId,
        recipientEmail: logEntry.recipientEmail.slice(0, 200),
        emailType: logEntry.emailType,
        provider: logEntry.provider.slice(0, 64),
        status: logEntry.status.slice(0, 32),
        sentAt: logEntry.sentAt.slice(0, 64),
        createdByUid: sanitizeId(uid),
        subject: (logEntry.subject || 'SAtenderAI Procurement Notification').slice(0, 300)
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
