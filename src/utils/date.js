export const parseISO = (str) => new Date(str);

export const differenceInDays = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

export const format = (date, pattern = 'dd/MM/yyyy') => {
  const d = new Date(date);
  if (isNaN(d)) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return pattern
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', year);
};

export const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const subDays = (date, amount) => {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
};

export const addDays = (date, amount) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};
