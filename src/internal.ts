/**
 * NotNever
 */

export type EmptyIfNever<T> = [T] extends [never] ? {} : T;

type NotNeverKeys<T> = { [P in keyof T]: T[P] extends never ? never : P }[keyof T];

/**
 * Filter properties removing `never`
 */

// prettier-ignore
export type WithoutNever<T> = (
  // if the output has no keys... (all keys filtered out)
  keyof Pick<T, NotNeverKeys<T>> extends never
  // ...return never
  ? never
  // otherwise we return the filtered object
  : { [K in keyof Pick<T, NotNeverKeys<T>>]: Pick<T, NotNeverKeys<T>>[K] });

// because WithoutNever return never if there are no properties
// calling WithoutNever multiple time cleanup stuff like { lvl1: { lvl2: { lvl3: never } } }
// prettier-ignore
export type WithoutNeverDeep<T> = (
  // WithoutNever<WithoutNever<WithoutNever<WithoutNever<WithoutNever<
    // WithoutNever<WithoutNever<WithoutNever<WithoutNever<WithoutNever<
      WithoutNever<WithoutNever<WithoutNever<WithoutNever<WithoutNever<
        WithoutNever<WithoutNever<WithoutNever<WithoutNever<
          WithoutNever<
            T
          >
        >>>>
      >>>>>
    // >>>>>
  // >>>>>
);
