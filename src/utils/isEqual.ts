export const isScopeEquals = (firstArr: string[], secondArr: string[]) => {
  if (firstArr.length !== secondArr.length) {
    return false;
  }

  const sortedFirstArr = firstArr.sort();
  const sortedSecondArr = secondArr.sort();

  for (let index = 0; index < firstArr.length; index += 1) {
    if (sortedFirstArr[index] !== sortedSecondArr[index]) {
      return false;
    }
  }

  return true;
};
