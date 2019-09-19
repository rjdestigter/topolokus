import { scan, map } from 'rxjs/operators'
import { merge, of } from 'rxjs'
import { Observable } from 'rxjs/internal/Observable'

declare const foo: Observable<Promise<number>>
declare const bar: Observable<string>

export default function combineLatest<A, B>(
    a: A,
    b: B,
): (a: Observable<A>, b: Observable<B>) => Observable<[A, B]>

export default function combineLatest<A, B, C>(
    a: A,
    b: B,
    c: C,
): (a: Observable<A>, b: Observable<B>, c: Observable<C>) => Observable<[A, B, C]>

export default function combineLatest<A, B, C, D>(
    a: A,
    b: B,
    c: C,
    d: D,
): (
    a: Observable<A>,
    b: Observable<B>,
    c: Observable<C>,
    d: Observable<D>,
) => Observable<[A, B, C, D]>

export default function combineLatest<A, B, C, D, E>(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
): (
    a: Observable<A>,
    b: Observable<B>,
    c: Observable<B>,
    d: Observable<D>,
    e: Observable<E>,
) => Observable<[A, B, C, D, E]>

export default function combineLatest(
    ...intial: any[]
): (...observables: Observable<any>[]) => Observable<any[]> {
    return (...observables: Observable<any>[]) => {
        const indexedObservables = observables.map((observable, index) =>
            observable.pipe(
                map(value => ({
                    value,
                    index,
                })),
            ),
        )

        return merge(...indexedObservables).pipe(
            scan((acc, next) => {
                const output = [...acc]
                output[next.index] = next.value
                return output
            }, intial),
        )
    }
}
