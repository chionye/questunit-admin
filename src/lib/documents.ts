// Display names for the document types renderers upload.
const DOC_LABELS: Record<string, string> = {
  nin: 'NIN',
  police_clearance: 'Police clearance',
  nin_or_police_clearance: 'NIN or police clearance',
  facial_verification: 'Face verification',
  guarantor: 'Guarantor',
  first_aid: 'First aid certificate',
  code_of_conduct: 'Affidavit of good conduct',
};

export const docLabel = (type: string) =>
  DOC_LABELS[type] ?? type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// The ID document (older apps uploaded it as "nin" or "police_clearance").
export const ID_DOCUMENT_TYPES = ['nin_or_police_clearance', 'nin', 'police_clearance'];

// Where someone is in onboarding, in plain words.
const ONBOARDING_STEPS: Record<string, string> = {
  phone_verification: 'Verifying phone',
  email_verification: 'Adding details',
  profile_setup: 'Adding details',
  service_selection: 'Choosing service',
  type_selection: 'Choosing service type',
  document_upload: 'Uploading documents',
  tool_upload: 'Uploading tools',
  verification_call: 'Booking verification call',
  state_selection: 'Choosing state',
};

export const onboardingLabel = (step?: string | null) =>
  step ? ONBOARDING_STEPS[step] ?? step.replace(/_/g, ' ') : 'Not started';
