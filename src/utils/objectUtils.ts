// objectUtils

 /**
 * Dismantle object into nested properties for chai nested assertion
 * @param prop - Property name to apply properties on / null if just dismantle object properties out
 * @param obj - Object to apply properties from
 */
export const dismantleNestedProperties = (prop: string | null, obj: any) => {

  const destructiveObj: any = {};
  const propName = prop ? `${prop}.` : '';

  for (const key of Object.keys(obj)) {

    if (Array.isArray(obj[key])) {
      for (let index = 0; index < obj[key].length; index += 1) {
        destructiveObj[propName + `${key}[${index}]`] = obj[key][index];
      }

    } else {
      destructiveObj[propName + `${key}`] = obj[key];
    }
  }

  return destructiveObj;
};

/**
 * Lowercase properties values in object.
 * [Supported for property containing strings or array of strings]
 * @param props - Array of properties names
 * @param obj - Object containing the properties to apply on
 */
export const lowerCasePropertiesValues = (props: string[], obj: any) => {

  for (const prop of props) {

    // If the property is array
    if (Array.isArray(obj[prop])) {
      for (let index = 0; index < obj[prop].length; index += 1) {
        obj[prop][index] = obj[prop][index].toLowerCase();
      }
    } else if (typeof obj[prop] === 'string') { // If the property is string
      obj[prop] = obj[prop].toLowerCase();
    }
  }

  return obj;
};

/**
 * Gets property name from interface safely with type checking.
 * @param name - name of the property
 */
export const propertyOf = <T>(name: keyof T) => name;

/**
 * Generates all possible object subsets using the properties of the object as the whole group
 * excluding the full object and empty object cases
 * @param fullObj - full example object for deriving the properties and values
 *
 * Ex: generateObjectSubsets({ name: 'Test', good: True, sleepTime: 4 })
 *     ==> [{ name: 'Test' }, { good: True }, { sleepTime: 4 },
 *          { name: 'Test', good: True }, { name: 'Test', sleepTime: 4 },
 *          { good: True, sleepTime: 4}]
 * (Not guaranteed for exact same order)
 * ]
 */
export function* generateObjectSubsets(fullObj: any): IterableIterator<any> {

  let result: any;
  let index: number;
  let numKeys: number;
  const keys = Object.keys(fullObj);

  // tslint:disable-next-line:no-increment-decrement
  for (let position = 1; position < Math.pow(2, keys.length); position++) {

    result = {};
    index = keys.length - 1;
    numKeys = 0;

    do {

      // For each position, turn on the bit in shifted index position
      // for getting all the positions possible
      if ((position & (1 << index)) !== 0) {
        result[keys[index]] = fullObj[keys[index]];
        // tslint:disable-next-line:no-increment-decrement
        numKeys++;
      }
    // tslint:disable-next-line:no-increment-decrement
    } while (index--);

    if (numKeys < keys.length) {
      yield result;
    }
  }
}

/**
 * Returns object without the specified keys (More efficient than delete command)
 * @param obj - Object to use on
 * @param keys - Keys to exclude from the object
 */
export const objWithoutKeys = (obj: any, keys: string[]) => {
  const newObj: any = {};

  for (const key in obj) {
    if (keys.indexOf(key) === -1) {
      newObj[key] = obj[key];
    }
  }

  return newObj;
};
