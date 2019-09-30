export const emptyArray: any[] = []

/** Return everything but the last element in an array. */
export const initial = <T>(xs: T[]) => {
    const clone = [...xs]
    clone.splice(xs.length - 1, 1)
    return clone
}

/** Return everything but the first element in array. */
export const tail = <T>(xs: T[]) => {
    const [_, ...t] = xs
    return t
}

/** Retrun the first element in an array. */
export const head = <T>(xs: T[]) => {
    const [h] = xs
    return h
}

/** Time */
export const last = <T>(xs: T[]) => {
    const [l] = [...xs].reverse()
    return l
}

export const returnEmptyArray = <T>(value: T): T =>
    Array.isArray(value) && value.length <= 0 ? (emptyArray as any) : value
