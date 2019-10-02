import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

const make = (log: (...args: any[]) => void) => <T>($: Observable<T>) =>
    $.pipe(
        tap(stream => {
            log.call(console, stream)
        }),
    )

export const warn = make(console.warn)
export const error = make(console.error)
export const log = make(console.log)
export const info = make(console.info)
