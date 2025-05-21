const express = require('express');
const cors = require('cors');
const { generateSchedule, generateSchedulePdf } = require('./services/schedule');
const enemContent = require('./data/enem-content.json');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: '*'
}));

const API_KEY = process.env.API_KEY;

function checkApiKey(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/', (request, response) => {
  return response.send('Welcome to cronoenem API');
})

app.post('/schedules', checkApiKey, async (request, response) => {
  const answers = request.body;

  const schedule = generateSchedule(answers, enemContent);

  return response.json(schedule);
});

app.post('/schedules/pdf', checkApiKey, async (request, response) => {
  const { htmlContent } = request.body;

  if (!htmlContent) {
    return response.status(400).json({ error: 'HTML not provided' })
  }

  try {
    const pdfBuffer = await generateSchedulePdf(htmlContent);

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=relatorio.pdf',
    })

    response.send(pdfBuffer)
  } catch (err) {
    console.error(err)
    response.status(500).json({ error: 'Failed to generate PDF' })
  }
});

app.listen(3333, () => console.log('Server running on port 3333'));