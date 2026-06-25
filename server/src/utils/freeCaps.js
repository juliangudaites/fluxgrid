/** Free tier caps — default when no paid access key is active. */
export const FREE_CAPS = {
  label: 'FLUXGRID',
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

export function getActiveCaps() {
  return FREE_CAPS;
}