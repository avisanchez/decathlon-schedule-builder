
/**
 * Create a 2D matrix
 * 
 * @param rows      The number of matrix rows
 * @param columns   The number of matrix columns
 * @param value     An optional default value for all entries
 * @returns A 2D array of the given type
 */
export default function makeMatrix2D<T>(rows: number, columns: number, value?: T): T[][] {
    let m: T[][] = [];
    for (let i = 0; i < rows; ++i) {
        let row = new Array<T>(columns);
        if (value !== undefined) {
            row.fill(value);
        }
        m.push(row);
    }
    return m;
}