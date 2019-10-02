import { returnEmptyArray } from './array'

export const memoize = <A, B>(f: (a: A) => B) => {
    let previousA: A | undefined
    let previousB: B | undefined

    return (a: A): B => {
        if (a !== previousA) {
            previousA = a
            previousB = f(a)
        }

        return returnEmptyArray(previousB as B)
    }
}

/**
 * ```hs
 * compose :: (b -> c) -> (a -> b) -> c
 * ```
 * Read as "f" after "g"
 * @typeparam A The first function argument taken.
 * @typeparam B The result type of function `g` and argument for function `f`
 * @typeparam C The result type of function `f`
 * @params f The function to pass the result of function `g` to
 * @params g Function that computes the first result `B`
 * @returns A function that takes `A` and returns `C` by applying output of `g` to `f`
 *
 * Function composition. f after g. g andThen f
 */
export const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A) => f(g(a))

/**
 * ```hs
 * flip :: (a -> b -> c) -> (b -> a -> c)
 * ```
 * @param f
 */
export const flip = <A, B, C>(f: (a: A, b: B) => C) => (b: B, a: A) => f(a, b)

/**
 * TODO
 * @param f
 */
export const curry = <A, B, C>(f: (a: A, b: B) => C) => (a: A) => (b: B) => f(a, b)
