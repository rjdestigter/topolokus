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
