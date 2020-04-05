export function pairWise<T>(arr: T[]): Iterable<T[]> {
    return {
        [Symbol.iterator]: function *() {
            for (let i = 0; i < arr.length; i += 2) {
                yield arr.slice(i, i+2)
            }
        }
    }
}