// api/monday.js — Vercel serverless proxy for Monday.com
// CommonJS format (no ESM export/import)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Action');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const TOKEN    = process.env.MONDAY_TOKEN;
  const BOARD_ID = process.env.MONDAY_BOARD_ID;
  const APP_KEY  = process.env.APP_SECRET_KEY;
  if (!TOKEN || !BOARD_ID) {
    res.status(500).json({ error: 'MONDAY_TOKEN or MONDAY_BOARD_ID not set in Vercel env vars.' });
    return;
  }
  // Simple API key guard — rejects requests not from our own app
  if (APP_KEY) {
    const reqKey = req.headers['x-app-key'] || '';
    if (reqKey !== APP_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  // Real column IDs from the board
  const COL = {
    status:               'color_mm3qb97z',
    last_reading_date:    'date_mm3qs979',
    last_reading:         'numeric_mm3qn5yb',
    current_reading_date: 'date_mm3q6j1b',
    current_reading:      'numeric_mm3q3q03',
    total_usage:          'numeric_mm3qw6qb',
    water_rate:           'numeric_mm3qge1y',
    wastewater_rate:      'numeric_mm3qf2v6',
    wastewater_usage:     'numeric_mm3qbqkg',
    water_amount:         'numeric_mm3qey12',
    wastewater_amount:    'numeric_mm3q4xdb',
    total_amount_due:     'numeric_mm3qjd1g',
    error_message:        'text_mm3qyeaf',
  };

  function safe(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

  const MONDAY_API  = 'https://api.monday.com/v2';
  const MONDAY_FILE = 'https://api.monday.com/v2/file';

  // Read raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuf = Buffer.concat(chunks);

  const contentType = req.headers['content-type'] || '';
  const action      = req.headers['x-action']     || '';

  // ── create_item ───────────────────────────────────────────
  if (contentType.includes('application/json') && action === 'create_item') {
    const data = JSON.parse(bodyBuf.toString());

    const itemName = [data.tenantName, data.address, data.thisDate]
      .filter(Boolean).join(' – ');

    const cv = {};
    cv[COL.status]               = { label: 'New' };
    cv[COL.client_name]          = data.tenantName        || '';
    cv[COL.agent_staff]          = data.agentName         || '';
    if (data.lastDate)  cv[COL.last_reading_date]    = { date: data.lastDate };
    cv[COL.last_reading]         = safe(data.lastKL);
    if (data.thisDate)  cv[COL.current_reading_date] = { date: data.thisDate };
    cv[COL.current_reading]      = safe(data.thisKL);
    cv[COL.total_usage]          = safe(data.usageKL);
    cv[COL.water_rate]           = safe(data.waterRate);
    cv[COL.wastewater_rate]      = safe(data.wastewaterRate);
    cv[COL.wastewater_usage]     = safe(data.wastewaterUsageKL);
    cv[COL.water_amount]         = safe(data.waterAmount);
    cv[COL.wastewater_amount]    = safe(data.wastewaterAmount);
    cv[COL.total_amount_due]     = safe(data.totalAmount);

    const query = `mutation {
      create_item(
        board_id: ${BOARD_ID},
        item_name: ${JSON.stringify(itemName)},
        column_values: ${JSON.stringify(JSON.stringify(cv))}
      ) { id }
    }`;

    const r = await fetch(MONDAY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN },
      body: JSON.stringify({ query })
    });
    const d = await r.json();
    if (d.errors) { res.status(400).json({ error: d.errors[0].message }); return; }
    res.status(200).json({ itemId: d.data.create_item.id });
    return;
  }

  // ── update_status ─────────────────────────────────────────
  if (contentType.includes('application/json') && action === 'update_status') {
    const { itemId, status, errorMessage } = JSON.parse(bodyBuf.toString());
    const cv = { [COL.status]: { label: status } };
    if (errorMessage) cv[COL.error_message] = errorMessage;

    const query = `mutation {
      change_multiple_column_values(
        board_id: ${BOARD_ID},
        item_id: ${itemId},
        column_values: ${JSON.stringify(JSON.stringify(cv))}
      ) { id }
    }`;
    const r = await fetch(MONDAY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN },
      body: JSON.stringify({ query })
    });
    const d = await r.json();
    res.status(200).json(d.errors ? { error: d.errors[0].message } : { ok: true });
    return;
  }

  // ── file upload proxy ─────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    const r = await fetch(MONDAY_FILE, {
      method: 'POST',
      headers: { 'Authorization': TOKEN, 'Content-Type': contentType },
      body: bodyBuf
    });
    const d = await r.json();
    res.status(r.status).json(d);
    return;
  }

  res.status(400).json({ error: 'Unknown action or content type' });
};
