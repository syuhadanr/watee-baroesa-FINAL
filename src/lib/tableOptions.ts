const generateTables = (prefix: string, count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `${prefix}-${(i + 1).toString().padStart(2, '0')}`);
};

export const tableOptions: string[] = [
  ...generateTables('Indoor', 20),
  ...generateTables('Outdoor', 15),
  ...generateTables('VIP', 10),
  ...generateTables('Terrace', 5),
];

export const publicTableOptions: string[] = ['Auto Assign', ...tableOptions];