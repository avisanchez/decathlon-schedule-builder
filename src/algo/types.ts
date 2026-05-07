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

    public setColumn(col: number | string, value: string | null, override: boolean = false) {
        let index: number = -1;
        if (typeof col === "string") {
            index = this.timeSlots.indexOf(col);
        } else if (typeof col === "number") {
            index = col;
        }
        if (index < 0) { return; }
        this.schedule = this.schedule.map(groupSchedule => {
            if (override || groupSchedule[index] === null) {
                groupSchedule[index] = value;
            }
            return groupSchedule;
        });
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

    public getRow(groupNum: number): number {
        return this.groups.findIndex((group) => group.groupNum === groupNum);
    }

    public getGroupNames(): string[] {
        return this.groups.map(groupNum => `Group ${groupNum}`);
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

    public getTime(col: number): string {
        return this.timeSlots[col];
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