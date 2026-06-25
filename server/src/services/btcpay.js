export function isBtcpayConfigured(config) {
  return Boolean(config.btcpayUrl && config.btcpayStoreId && config.btcpayApiKey);
}

export async function createBtcpayInvoice(config, { amount, currency, tipId, metadata = {} }) {
  const base = config.btcpayUrl.replace(/\/$/, '');
  const url = `${base}/api/v1/stores/${config.btcpayStoreId}/invoices`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${config.btcpayApiKey}`,
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: currency.toUpperCase(),
      metadata: { tipId, source: 'fluxgrid', ...metadata },
      checkout: {
        redirectURL: config.tipSuccessUrl || undefined,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`BTCPay error: ${err.slice(0, 200)}`);
  }

  const invoice = await res.json();
  return {
    invoiceId: invoice.id,
    checkoutUrl: invoice.checkoutLink,
    status: invoice.status,
  };
}

export async function getBtcpayInvoiceStatus(config, invoiceId) {
  const base = config.btcpayUrl.replace(/\/$/, '');
  const url = `${base}/api/v1/stores/${config.btcpayStoreId}/invoices/${invoiceId}`;

  const res = await fetch(url, {
    headers: { Authorization: `token ${config.btcpayApiKey}` },
  });

  if (!res.ok) throw new Error('Invoice not found');
  const invoice = await res.json();
  return {
    invoiceId: invoice.id,
    status: invoice.status,
    paid: ['Settled', 'Processing', 'Complete'].includes(invoice.status),
  };
}