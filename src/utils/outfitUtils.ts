/**
 * Devuelve un número aleatorio entre min y max (incluidos ambos extremos)
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Devuelve un elemento aleatorio de un array.
 * Si el array está vacío, retorna null.
 */
export function getRandomItem<T>(array: T[]): T | null {
  if (!array.length) return null;
  return array[getRandomNumber(0, array.length - 1)];
}

export const getRandomItems = (items: any[]) => {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};