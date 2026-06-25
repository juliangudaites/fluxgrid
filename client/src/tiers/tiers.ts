export type TierId = 'void' | 'signal' | 'pulse' | 'flux';

export interface TierCaps {
  label: string;
  vanityIds: boolean;
  maxContent: number;
  burner: boolean;
  burnOptions: number[];
  maxBurnSeconds: number;
  boosted: boolean;
  attachments: boolean;
  pinMessages: boolean;
  priorityStyle: boolean;
  maxImageBytes: number;
  maxVideoBytes: number;
  deepVoid?: boolean;
}

export const FREE_CAPS: TierCaps = {
  label: 'VOID',
  vanityIds: false,
  maxContent: 2000,
  burner: false,
  burnOptions: [],
  maxBurnSeconds: 0,
  boosted: false,
  attachments: false,
  pinMessages: false,
  priorityStyle: false,
  maxImageBytes: 0,
  maxVideoBytes: 0,
};

export const FLUX_BURN_OPTIONS = [
  { label: '30 seconds', seconds: 30 },
  { label: '60 seconds', seconds: 60 },
  { label: '12 hours', seconds: 12 * 60 * 60 },
  { label: '24 hours', seconds: 24 * 60 * 60 },
  { label: '48 hours', seconds: 48 * 60 * 60 },
];