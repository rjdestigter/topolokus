export default <T>(value: number | T): value is T => typeof value !== 'number'
