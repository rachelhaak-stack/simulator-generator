export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { scenario, timelimit, difficulty, context } = req.body;

  if (!scenario) return res.status(400).json({ error: 'Scenario is required' });

  const difficultyNote = {
    straightforward: 'one clear scenario with no complications',
    moderate: 'one complication or update that arrives mid-way through (e.g. a second stakeholder calls, new information changes things)',
    challenging: 'two or three curveballs that arrive at different points and require the learner to update their response'
  }[difficulty] || 'one complication mid-way through';

  const prompt = `You are an expert learning experience designer specialising in high-pressure government and political office scenarios. Your job is to generate a complete, standalone, interactive HTML simulator.

The simulator must:
- Be a timed practice tool for: ${scenario}
- Time limit: ${timelimit} minutes
- Difficulty: ${difficultyNote}
- Audience: newly elected officials and their staff — politically savvy, administratively inexperienced, time-poor${context ? ', ' + context : ''}

Generate a COMPLETE, self-contained HTML page (with all CSS and JS inline) that:

1. INTRO SCREEN: Shows a realistic, specific scenario (not generic) with a clear task. The scenario should feel authentic to a UK political office context. Include a "Start the clock" button.

2. MAIN FORM SCREEN:
   - A countdown timer (${timelimit} minutes) displayed prominently, changing colour as time runs low (green → amber at 40% → red at 20%)
   - 4-6 clearly labelled sections matching what the template type requires
   - Each section has a "hint" button that reveals a brief coaching note
   - Progress dots showing how far through the form they are
   - ${difficulty !== 'straightforward' ? 'A mid-scenario update banner that appears after ' + Math.round(parseInt(timelimit) * 0.3) + ' minutes with a complication' : ''}
   - A "Submit brief" button

3. FEEDBACK SCREEN:
   - Time taken displayed
   - A checklist of 5-7 specific criteria auto-scored against what they entered
   - A progress bar showing score
   - A contextual result message (strong/good/retry)
   - A "Try again" button that fully resets

Design requirements:
- Clean, minimal design
- Use system fonts
- White cards on a light grey background
- Green for success, amber for warning, red for danger
- Sentence case everywhere
- No emojis
- Mobile-friendly

Output ONLY the complete HTML — no explanation, no markdown fences, no preamble. Start with <!DOCTYPE html> and end with </html>.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    let html = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    res.status(200).json({ html });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
