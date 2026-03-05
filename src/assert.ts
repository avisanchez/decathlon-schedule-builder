
export default function assert(predicate: boolean): void {
    if (predicate) {
        return;
    }
    const message = `${assert.caller.name} failed assert.`
    throw Error(message);
}