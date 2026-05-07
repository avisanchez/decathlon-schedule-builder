import { Activity } from "../activity/types";
import { Group } from "../group/types";
import { Constraint } from "../schedule/ConstraintList";
import { DaySchedule, WeekCoordinate } from "./types";

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

export function isValid(c: Constraint, activity: Activity, pos: WeekCoordinate, weekSchedule: DaySchedule[]): boolean {

    // note that the parenthesis around case statement logic is necessary to avoid duplicate variable definition errors
    switch (c.type) {
        case "single": {
            const rowSet = new Set(weekSchedule[pos.day].getSchedule()[pos.row]);
            return !rowSet.has(activity.code);
        }
        case "group": {
            if (activity.code !== c.activity) { return true; }
            const currGroup: Group | undefined = weekSchedule[pos.day].getGroup(pos.row);
            if (currGroup === undefined || c.groups === undefined || c.allowed === undefined) {
                return false;
            }
            return c.allowed === c.groups.has(currGroup.groupNum);
        }
        case "mandatory": {
            if (c.activity === undefined || c.time === undefined) {
                console.error("Attempting to apply invalid 'mandatory' constraint. Ignoring constraint.")
                return true;
            }
            const currTime: string = weekSchedule[pos.day].getTime(pos.col);
            if (currTime === c.time) { return activity.code === c.activity; }
            return true;
        }
        case "regular": {
            if (activity.multigroup) { return true; }
            const colSet = new Set(weekSchedule[pos.day].getSchedule().map(row => row[pos.col]));
            return !(colSet.has(activity.code));
        }
        case "multi": {
            const group: Group | undefined = weekSchedule[pos.day].getGroup(pos.row);
            if (group === undefined || c.activity === undefined || c.groupings === undefined) {
                console.error("Attempting to apply invalid 'mandatory' constraint. Ignoring constraint.")
                return true;
            }
            const grouping = c.groupings?.find(grouping => grouping.has(group.groupNum));
            if (grouping === undefined) {
                console.error("Could not find meta-grouping for the given group. Ignoring constraint.")
                return true;
            }

            // we will ONLY even consider scheduling the activity if no one else in our grouping is busy
            const colList = weekSchedule[pos.day].getSchedule().map(row => row[pos.col]);

            let canSchedule = true; // all of the groups in our grouping are either already participating in the activity or are free
            let isBeingDoneByGroupingMemeber = false;
            for (let i = 0; i < colList.length; ++i) {
                const currGroup: Group | undefined = weekSchedule[pos.day].getGroup(i); // this is unsafe
                if (currGroup === undefined) { continue; }
                const currActivity: string | null = colList[i];

                if (grouping.has(currGroup.groupNum)) { // this is a group in our grouping
                    if (!isBeingDoneByGroupingMemeber) { isBeingDoneByGroupingMemeber = currActivity === c.activity }
                    canSchedule = canSchedule && (currActivity === null || currActivity === c.activity);
                } else { // this is a group outside our grouping
                    canSchedule = canSchedule && (currActivity !== c.activity);
                }
            }
            // if its being done by someone in our group, we must schedule it, otherwise we simply say we can schedule it
            if (canSchedule && isBeingDoneByGroupingMemeber) {
                return c.activity === activity.code;
            } else if (canSchedule) {
                return true;
            } else {
                return c.activity !== activity.code;
            }
        }
        default:
            return true;
    }
}