const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data')
const tailwindCssPath = path.resolve(__dirname, '../assets/tailwind.minify.css');
const tailwindCss = fs.readFileSync(tailwindCssPath, 'utf-8');
const { getWeeksUntilEnem } = require('../lib/enem');

const PDF_API_URL = process.env.PDF_API_URL;

module.exports = {
  generateSchedule: (answers, content) => {
    const weeksUntilExam = getWeeksUntilEnem();
    const weeklyLoad = answers.daysPerWeek * answers.hoursPerDay;
    const minutesPerTopic = 30;
    const contentsPerWeek = Math.floor((weeklyLoad * 60) / minutesPerTopic);

    const harderSubjects = content.filter(c => answers.harderSubjects.includes(c.subject));
    const preferred = answers.preferredArea
      ? content.filter(c => c.area === answers.preferredArea)
      : [];
    const remaining = content.filter(c =>
      !harderSubjects.includes(c) && !preferred.includes(c)
    );

    const schedule = [];

    const weekDaysOnly = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const weekend = ["Saturday", "Sunday"];
    const daysOfWeek = [...weekDaysOnly, ...weekend];

    function getDistributedDays(daysPerWeek){
      let baseDays = weekDaysOnly;
      if (daysPerWeek > weekDaysOnly.length) {
        baseDays = daysOfWeek;
      }
      
      const step = (baseDays.length - 1) / (daysPerWeek - 1);
      const result = [];
      for (let i = 0; i < daysPerWeek; i++) {
        result.push(baseDays[Math.round(i * step)]);
      }

      return Array.from(new Set(result));
    }

    const availableDays = getDistributedDays(answers.daysPerWeek);
    const contentsPerDay = Math.floor(contentsPerWeek / answers.daysPerWeek);

    for (let week = 1; week <= weeksUntilExam; week++) {
      const weekDays= [];

      for (const day of availableDays) {
        const dayContents = [];

        const HARDER_SUBJECTS_WEIGHT = 0.4;
        const PREFERRED_AREA_WEIGHT = 0.2;
        const numharderSubjects = Math.floor(contentsPerDay * HARDER_SUBJECTS_WEIGHT);
        const numPreferred = Math.floor(contentsPerDay * PREFERRED_AREA_WEIGHT);
        const numRemaining = contentsPerDay - (numharderSubjects + numPreferred);

        // Random selection helper
        const pickRandom = (array, count) => {
          const selected = [];
          const pool = [...array];
          while (pool.length && selected.length < count) {
            const idx = Math.floor(Math.random() * pool.length);
            selected.push(pool.splice(idx, 1)[0]);
          }
          return selected;
        };

        dayContents.push(...pickRandom(harderSubjects, numharderSubjects));
        dayContents.push(...pickRandom(preferred, numPreferred));
        dayContents.push(...pickRandom(remaining, numRemaining));

        weekDays.push({
          day,
          contents: dayContents
        });
      }

      schedule.push({
        week,
        days: weekDays
      });
    }

    return schedule;
  },

  generateSchedulePdf: async (scheduleHtmlContent) => {
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
          ${scheduleHtmlContent}
        </body>
      </html>
    `

    const form = new FormData()
    form.append('files', Buffer.from(html), {
      filename: 'index.html',
      contentType: 'text/html',
    })

    const response = await axios.post(
      `${PDF_API_URL}/forms/chromium/convert/html`,
      form,
      {
        headers: form.getHeaders(),
        responseType: 'arraybuffer', // PDF será um buffer
      }
    )

    return response.data 
  }
}