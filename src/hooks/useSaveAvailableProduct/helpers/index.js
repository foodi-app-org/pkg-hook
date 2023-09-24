export const days = [
  {
    day: 1,
    name: 'L'
  },
  {
    day: 2,
    name: 'M'
  },
  {
    day: 3,
    name: 'MI'
  },
  {
    day: 4,
    name: 'J'
  },
  {
    day: 5,
    name: 'V'
  },
  {
    day: 6,
    name: 'S'
  },
  {
    day: 0,
    name: 'D'
  }
]

export const arraysAreEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};
