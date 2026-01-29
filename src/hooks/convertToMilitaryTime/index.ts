export function convertToMilitaryTime(time12Hour: string): string {
  const [time, period]: [string, string] = time12Hour.split(' ') as [string, string];
  let [hours, minutes]: [string, string] = time.split(':') as [string, string];

  if (period === 'PM' && hours !== '12') {
    hours = String(Number(hours) + 12);
  }

  if (period === 'AM' && hours === '12') {
    hours = '00';
  }

  return `${hours}:${minutes}`;
}