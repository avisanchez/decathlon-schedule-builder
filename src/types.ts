import { checkDimensions, makeMatrix2D } from "./algo/utils"
import { GroupUtils } from "./utils/GroupUtils"


export type DayScheduleEntry = string | null
export type DaySchedule = DayScheduleEntry[][]
export type WeekSchedule = DaySchedule[]

export type DayScheduleCoordinate = {
    row: number,
    col: number
}
export type WeekScheduleCoordinate = {
    day: number,
    row: number,
    col: number
}

export enum Gender {
    MALE,
    FEMALE
}

export type Group = {
    groupNum: number // expected to be a whole number. To specify a group x.5, set isSplit=true
    isSplit?: boolean // whether the group is split in two
    gender?: Gender
}

export type Activity = {
    code: string            // A unique nickname to identify the activity (ex. A&C)
    name?: string           // An optional full description of the activity (ex. Arts and Crafts)
    multigroup?: boolean    // Whether the activity involves multiple groups participating simultaneously
    special?: boolean       // Special activities can only be managed by hand. They are ignored by the scheduler. Examples include (ST=soccer tournament).
}

/**
 * Encapsulates important information about the master schedule for a given day, 
 * such as groups, time slots, and a matrix of activities.
 * Provides an interface to quickly query schedule.
 */
export class DayScheduleIndex {
    constructor(groups: Group[], timeSlots: string[]) {
        this.timeSlots = timeSlots;
        this.groups = groups.flatMap(group => {
            const temp = [{ ...group, groupNum: group.groupNum }];
            if (group.isSplit) { temp.push({ ...group, groupNum: group.groupNum + 0.5 }); }
            return temp;
        });
        this.schedule = makeMatrix2D<string | null>(this.groups.length, this.timeSlots.length, null);
    }

    public getSchedule(): DaySchedule {
        return this.schedule;
    }

    public setSchedule(schedule: DaySchedule): void {
        if (checkDimensions(this.schedule, schedule)) {
            this.schedule = schedule;
        } else {
            console.warn("Attempting to set schedule with incorrect dimensions. Aborting.");
        }
    }

    public setColumn(col: number | string, value: DayScheduleEntry, override: boolean = false) {
        let colIndex: number = -1;
        if (typeof col === "string") {
            colIndex = this.timeSlots.indexOf(col);
        } else if (typeof col === "number") {
            colIndex = col;
        }
        if (colIndex < 0) {
            return console.warn(`Attempting to set column '${col}' produced invalid column index.`);
        }
        this.schedule = this.schedule.map(groupSchedule => {
            if (override || groupSchedule[colIndex] === null) {
                groupSchedule[colIndex] = value;
            }
            return groupSchedule;
        });
    }

    public getRow(groupNum: number): number {
        return this.groups.findIndex((group) => group.groupNum === groupNum);
    }

    /**
     * Apply a batch update of a set of cells in the current schedule.
     * @param updates A set of updates specified by the cell and its new value.
     */
    public updateSchedule(
        updates: Set<{
            cell: DayScheduleCoordinate,
            newValue: DayScheduleEntry
        }>
    ) {
        updates.forEach(update => {
            if (update.cell.row < 0 ||
                update.cell.row > this.schedule.length ||
                update.cell.col < 0 ||
                update.cell.col > this.schedule[update.cell.row].length) {
                throw new Error(`Attempting to update invalid coordinate (${update.cell.row},${update.cell.col}).`);
            }
            const newValue = update.newValue === "" ? null : update.newValue;
            this.schedule[update.cell.row][update.cell.col] = newValue;
        });
    }

    // Set all the entries of the current schedule to null
    public clearSchedule(): void {
        this.schedule = makeMatrix2D(this.groups.length, this.timeSlots.length, null);
    }

    public getGroups(): Group[] {
        return this.groups;
    }

    public getGroup(row: number): Group {
        return this.groups[row];
    }

    public getGroupNames(): string[] {
        return this.groups.map(group => `Group ${group.groupNum}`);
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
            return GroupUtils.toString(this.groups[row].groupNum);
        }
        console.error(`Error: No group exists at row ${row}`);
        return "";
    }

    public getTimeSlots(): string[] {
        return this.timeSlots;
    }

    public getTime(col: number): string {
        return this.timeSlots[col];
    }

    private timeSlots: string[];
    private groups: Group[];
    private schedule: DaySchedule;
}