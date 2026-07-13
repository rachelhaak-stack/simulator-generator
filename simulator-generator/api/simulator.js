const simulators = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: 'No HTML provided' });
    const id = Math.random().toString(36).slice(2, 10);
    simulators[id] = html;
    return res.status(200).json({ id });
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id || !simulators[id]) return res.status(404).send('Simulator not found — please generate a new one.');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(simulators[id]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
