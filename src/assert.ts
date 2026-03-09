
export default function assert(predicate: boolean): void {
    if (predicate) {
        return;
    }
    const message = `Failed assert.`
    throw Error(message);
}