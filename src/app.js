const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const tailwindCss = fs.readFileSync('./src/assets/tailwind.minify.css', 'utf-8');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: '*'
}));

// TODO: adicionar autorização
app.get('/', (request, response) => {
  return response.send('Welcome to cronoenem API');
})
app.post('/pdf', async (request, response) => {
  const { htmlContent } = request.body;

  if (!htmlContent) {
    return response.status(400).json({ error: 'HTML not provided' })
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Relatório</title>
          <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">

          <style>
            @media print {
              thead { display: table-row-group; }
            }

            ${tailwindCss}
          </style>
        </head>
        <body class="p-8 bg-emerald-50">
          ${htmlContent}
        </body>
      </html>
    `

    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    })

    await browser.close()

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