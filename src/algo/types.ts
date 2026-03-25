import { Activity } from "../activity/types"
import { Group } from "../group/types"
import { checkDimensions, makeMatrix2D } from "./utils";

export type TimeSlot = { time: string, mandatoryActivity?: Activity }
export type Schedule = (string | null)[][]

/**
 * Encapsulates important information about the master schedule for a given day, 
 * such as groups, time slots, and a matrix of activities.
 * Provides an interface to quickly query schedule.
 */
export class DaySchedule {
    constructor(groups: Group[], slots: TimeSlot[]) {
        this.timeSlots = slots;

        this.groups = [];
        groups.forEach(group => {
            this.groups.push(group);
            if (group.isSplit) {
                this.groups.push({ ...group, groupNum: group.groupNum + 0.5 });
            }
        })
        this.schedule = makeMatrix2D<string | null>(this.groups.length, this.timeSlots.length, null);
    }

    public getSchedule(): Schedule {
        return this.schedule;
    }

    public setSchedule(newSchedule: Schedule) {
        if (checkDimensions(this.schedule, newSchedule)) {
            this.schedule = newSchedule;
        }
    }

    /**
     * Apply a batch update of a set of cells in the current schedule.
     * @param updates A set of updates specified by the cell and its new value.
     */
    public updateSchedule(updates: Set<{ cell: Coordinate, newValue: string }>) {
        updates.forEach(update => {
            if (update.cell.row < 0 ||
                update.cell.row > this.schedule.length ||
                update.cell.col < 0 ||
                update.cell.col > this.schedule[update.cell.row].length) {
                throw new Error(`Attempint to update (${update.cell.row},${update.cell.col}) which is invalid.`);
            }
            this.schedule[update.cell.row][update.cell.col] = update.newValue === "" ? null : update.newValue;
        });
    }

    // Set all the entries of the current schedule to null
    public clearSchedule(): void {
        this.schedule = makeMatrix2D(this.groups.length, this.timeSlots.length, null);
    }

    public getGroups(): Group[] {
        return this.groups;
    }

    public getGroup(row: number): (Group | undefined) {
        return this.groups[row];
    }

    public getGroupNames(): string[] {
        let groupNames: string[] = [];
        this.groups.forEach(group => {
            groupNames.push(`Group ${group.groupNum}`);

            if (group.isSplit) {
                groupNames.push(`Group ${group.groupNum}.5`);
            }
        });

        return groupNames;
    }

    /**
     * Get the name of the group at a given row in the day schedule. 
     * The function throws an error if there is no group at the specified row.
     * 
     * @param row The row in the schedule corresponding to the given group.
     * @returns A string repre
     */
    public getGroupName(row: number): string {
        if (0 <= row && row < this.groups.length) {
            return `Group ${this.groups[row].groupNum}`;
        }

        const errorMessage: string = `Error in getGroupName(...): No group exists at row ${row}`;
        alert(errorMessage);
        throw new Error(errorMessage);
    }

    public getTimeSlots(): TimeSlot[] {
        return this.timeSlots;
    }

    private timeSlots: TimeSlot[];
    private groups: Group[];
    private schedule: Schedule;
}

/**
 * A table cell coordinate
 * @todo Consider renaming to TableCellCoordinate for clarity
 */
export type Coordinate = { row: number, col: number }

/**
 * Interface for scheduling algorithm constraints
 */
export interface Constraint {
    /**
     * Determine whether the specified group is allowed to participate in the particular activity.
     * @param group 
     * @param activity
     * @return True if the group is allowed to participate in the given activity, false otherwise.
     */
    isValid(group: Group, activity: Activity, row: (Activity | null)[], col: (Activity | null)[]): boolean; /** @todo add row and column variables */
}

/**
 * A constraint specifying which groups are to be excluded from a given activity.
 */
export class ExcludeGroupsConstraint implements Constraint {
    /**
     * @param rule Each key in the map is an activity code. The groups specified for a given key are not allowed to participate in the activity with the given code.
     * 
     * Usage:
     * To exclude group 8, 9 and 10 from participating in Arts & Crafts provide the following rule:
     * ["A&C" : new Set([8, 9, 10])]
     */
    constructor(rule: Map<string, Set<number>>) {
        this.rule = rule;
    }

    public isValid(group: Group, activity: Activity, row: Activity[], col: Activity[]): boolean {
        return !(this.rule.get(activity.code)?.has(group.groupNum) ?? false);
    }

    private rule: Map<string, Set<number>>;
}

export class MultiGroupActivityConstraint implements Constraint {
    constructor(rule: Map<string, Set<number>[]>) {
        this.rule = rule;
    }
    public isValid(group: Group, activity: Activity, row: (Activity | null)[], col: (Activity | null)[]): boolean {
        const colSet = new Set(col.map(c => { return c?.code ?? "" }));

        if (!this.rule.has(activity.code) || !colSet.has(activity.code)) {
            return true;
        }

        const groupSets: Set<number>[] = this.rule.get(activity.code)!.filter(set => { return set.has(group.groupNum) });

        if (groupSets.length != 1) {
            console.error(`Expected group to appear exactly once in a set but instead appeared ${groupSets.length} times`);
            return groupSets.length === 0 ? !colSet.has(activity.code) : false;
        }

        const groupSet = groupSets[0];

        let isValid = col.filter((a, i) => { return !groupSet.has(i + 1) && activity?.code === a?.code }).length === 0;
        if (isValid) {
            groupSet.forEach(groupNum => {
                if (col[groupNum - 1] !== null && col[groupNum - 1]?.code !== activity.code) { /** @todo this only works for situations without a split group */
                    isValid = false;
                }
            });
        }
        return isValid;
    }

    private rule: Map<string, Set<number>[]>;
}

// This constraint is bypassed in the case of a multigroup activity
export class SingleInstanceConstraint implements Constraint {
    constructor() {

    }

    public isValid(group: Group, activity: Activity, row: (Activity | null)[], col: (Activity | null)[]): boolean {
        const rowSet = new Set(row);
        const colSet = new Set(col);

        if (rowSet.has(activity)) {
            return false;
        }
        return activity.multigroup === true || !colSet.has(activity);
    }
}

export class SpecialActivityConstraint implements Constraint {
    constructor() {

    }

    public isValid(group: Group, activity: Activity, row: (Activity | null)[], col: (Activity | null)[]): boolean {
        return activity.special === false;
    }
}