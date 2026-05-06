import { act } from "react";
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
    constructor(groups: Group[], slots: string[]) {
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

    public getTimeSlots(): string[] {
        return this.timeSlots;
    }

    private timeSlots: string[];
    private groups: Group[];
    private schedule: Schedule;
}

/**
 * A table cell coordinate
 * @todo Consider renaming to TableCellCoordinate for clarity
 */
export type Coordinate = { row: number, col: number }

export type WeekCoordinate = { day: number, row: number, col: number }

/**
 * Interface for scheduling algorithm constraints
 */
export interface Constraint {
    /**
     * Determine whether the specified group is allowed to participate in the particular activity.
     * @todo write params
     * @return True if the group is allowed to participate in the given activity, false otherwise.
     */
    isValid(activity: string, pos: WeekCoordinate, schedule: DaySchedule[]): boolean;
}

/**
 * A group is limited to doing an activity at most once per day.
 */
export class SingleInstanceConstraint implements Constraint {
    public isValid(activity: string, pos: WeekCoordinate, schedule: DaySchedule[]): boolean {
        const rowSet = new Set(schedule[pos.day].getSchedule()[pos.row]);
        return !rowSet.has(activity);
    }
}

/**
 * Specify which groups are to be excluded from a given activity.
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

    public isValid(activity: string, pos: WeekCoordinate, schedule: DaySchedule[]): boolean {
        const group: Group | undefined = schedule[pos.day].getGroup(pos.row);
        const excludedGroups = this.rule.get(activity);

        if (group === undefined) {
            return false;
        }

        return !(excludedGroups?.has(group.groupNum));
    }

    private rule: Map<string, Set<number>>;
}

export class MultiGroupActivityConstraint implements Constraint {
    constructor(rule: Map<string, Set<number>[]>) {
        this.rule = rule;
    }
    public isValid(activity: string, pos: WeekCoordinate, schedule: DaySchedule[]): boolean {
        const group: Group | undefined = schedule[pos.day].getGroup(pos.row);
        const colSet = new Set(schedule[pos.day].getSchedule().map(row => row[pos.col]));
        const groupings: Set<number>[] | undefined = this.rule.get(activity);

        if (group === undefined) {
            return false;
        } else if (!colSet.has(activity)) { // no one is currently doing the activity, so it is certainly valid
            return true;
        } else if (groupings === undefined) { // any activity not in our rule map is implicitly single-group-only
            return false;
        }

        const grouping = groupings.find(grouping => grouping.has(group.groupNum));

        if (grouping === undefined) {
            return false;
        }

        for (let i = 0; i < schedule[pos.day].getSchedule().length; ++i) {
            // in english: if any group outside our grouping has the specified activity, then it is invalid
            if (schedule[pos.day].getSchedule()[pos.row][pos.col] === activity && !grouping.has(schedule[pos.day].getGroup(i)?.groupNum ?? -1)) {
                return false;
            }
        }
        return true;
    }

    private rule: Map<string, Set<number>[]>;
}