import { act } from "react";
import { Activity } from "../activity/types"
import assert from "../assert";
import { Group } from "../group/types"
import makeMatrix2D from "./utils";

export type TimeSlot = { time: string, mandatoryActivity?: Activity }

export class DaySchedule {
    constructor(groups: Group[], slots: TimeSlot[]) {
        this.groups = groups;
        this.slots = slots;

        this._groups = [];
        groups.forEach(group => {
            this._groups.push(group);
            if (group.isSplit) {
                this._groups.push({ ...group, groupNum: group.groupNum + 0.5 })
            }
        })
        this.schedule = makeMatrix2D(this._groups.length, this.slots.length, null);
    }

    public getSchedule(): (Activity | null)[][] {
        return this.schedule;
    }

    public setSchedule(schedule: (Activity | null)[][]) {
        /**@todo this is unsafe: ensure dimensions match */
        this.schedule = schedule;
    }

    public clearSchedule(): void {
        this.schedule = makeMatrix2D(this._groups.length, this.slots.length, null);
    }

    public groupName(forRow: number): string {
        if (0 <= forRow && forRow < this._groups.length) {
            return `Group ${this._groups[forRow].groupNum}`;
        }
        return "ERROR";
    }

    public getGroups(): Group[] {
        return this._groups;
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

    public getGroup(row: number): (Group | undefined) {
        return this._groups[row];
    }

    public groups: Group[];
    public slots: TimeSlot[];
    private _groups: Group[];
    private schedule: (Activity | null)[][];
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