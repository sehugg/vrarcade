
import MyWorker from './nes?worker'

export function startNESWorker() {
    const worker = new MyWorker();
    return worker;
}
