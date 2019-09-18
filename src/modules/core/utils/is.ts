export default <A, B extends A>(value: A) => (compare: B) => value === compare
