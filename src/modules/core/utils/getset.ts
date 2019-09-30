export const get = <K extends string>(prop: K) => <U, T extends { [P in K]: U }>(obj: T) =>
    obj[prop]
