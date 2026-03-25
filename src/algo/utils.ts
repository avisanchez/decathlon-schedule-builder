
/**
 * Create a 2D matrix
 * 
 * @param rows      The number of matrix rows
 * @param columns   The number of matrix columns
 * @param value     An optional default value for all entries
 * @returns A 2D array of the given type
 */
export function makeMatrix2D<T>(rows: number, columns: number, value?: T): T[][] {
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

/**
 * Check whether two 2D matricies match in their dimensions.
 * 
 * @param m1    The first matrix
 * @param m2    The second matrix
 * @returns True if the matricies are identical in their number of rows and columns, false otherwise.
 */
export function checkDimensions<T>(m1: T[][], m2: T[][]): boolean {
    // check rows
    if (m1.length !== m2.length) {
        return false;
    }

    // check columns
    let columnCountsMatch: boolean = true;
    m1.forEach((row, i) => {
        if (row.length !== m2[i].length) {
            columnCountsMatch = false;
        }
    });
    return columnCountsMatch;
}

// export function suffleArrayInPlace<T>(arr: T[]): T[] {
//     let currentIndex = arr.length, randomIndex: number;

//     while (currentIndex !== 0) {
        
//     }
// }