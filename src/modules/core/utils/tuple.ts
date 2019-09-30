/** Converts value a and b into a tuple */
export const tuple = <A, B>(a: A, b: B): [A, B] => [a, b]

/** Returns the first element of a tuple */
export const first = <A>([a]: [A, any]): A => a

/** Returns the second element of a tuple */
export const second = <B>([, b]: [any, B]): B => b
