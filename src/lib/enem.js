const { FIRST_DAY_ENEM } = require('../utils/constants');

function getWeeksUntilEnem() {
  const today = new Date();

  // Zera horas, minutos, segundos e milissegundos das duas datas
  today.setHours(0, 0, 0, 0);
  FIRST_DAY_ENEM.setHours(0, 0, 0, 0);

  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const diffMs = FIRST_DAY_ENEM.getTime() - today.getTime();
  const weeks = Math.ceil(diffMs / msPerWeek);

  return weeks > 0 ? weeks : -1;
}

module.exports = {
  getWeeksUntilEnem,
};
