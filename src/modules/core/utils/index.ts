/** Returns the first element of a tuple */
export const first = <A, B>(t: [A, B]): A => t[0]

export const memoize = <A, B>(f: (a: A) => B) => {
    let previousA: A | undefined
    let previousB: B | undefined

    return (a: A): B => {
        if (a !== previousA) {
            previousA = a
            previousB = f(a)
        }

        return previousB as B
    }
}
