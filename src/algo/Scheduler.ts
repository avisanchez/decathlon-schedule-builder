import { Activity } from "../activity/types"
import { Group } from "../group/types"
import { Constraint, Coordinate, DaySchedule } from "./types"
import makeMatrix2D from "./utils";

type Schedule = (Activity | null)[][];

class Scheduler {
    private MAX_ITERATIONS = 10000;

    constructor(daySchedule: DaySchedule, activities: Activity[], constraints: Constraint[]) {
        this.daySchedule = daySchedule;
        this.activities = activities;
        this.constraints = constraints;
        this.reset();
    }

    /**
     * Reset all scheduling variables to their inital values.
     */
    private reset() {
        this.currSchedule = this.daySchedule.getSchedule();
        this.bestSchedule = [];
        this.currScore = 0;
        this.bestScore = -Infinity;
        this.numCellsToFill = this.countCellsToFill();
        this.iterations = 0;
    }

    public genDaySchedule(): (Activity | null)[][] {
        this.reset();
        this._genDaySchedule();
        console.log("The best schedule found was", this.bestSchedule);
        return this.bestSchedule;
    }

    /**
     * Get the coordinate of the next cell to fill.
     * 
     * Discussion:
     * The current implementation simply finds the first empty cell starting 
     * its search from top left to bottom right.
     * 
     * @returns The coordinate of the next cell to fill.
     */
    private getNextCell(): Coordinate {
        for (let i = 0; i < this.currSchedule.length; ++i) {
            for (let j = 0; j < this.currSchedule[i].length; ++j) {
                if (this.currSchedule[i][j] == null) {
                    return { row: i, col: j };
                }
            }
        }
        console.error(`${this.getNextCell.name} was called when there were no empty cells.`)
        return { row: -1, col: -1 };
    }

    /**
     * Get the valid activities for a given group at a given time (i.e. cell). An activity is considered valid if it has not been used by the current group, and is not currently being used by another group.
     * @param cell The cell for which to retrieve the available activities.
     * @returns An array of available activities.
     */
    private getValidActivities(cell: Coordinate): Activity[] {
        const mandatoryActivity = this.daySchedule.slots[cell.col].mandatoryActivity;
        if (mandatoryActivity !== undefined) {
            return [mandatoryActivity];
        }

        const row = this.currSchedule[cell.row];
        const col = this.currSchedule.map(row => { return row[cell.col] });

        return this.activities.filter(activity => {
            return this.constraints.every(c => c.isValid(this.daySchedule.getGroup(cell.row)!, activity, row, col));
        });
    }

    /**
     * Get the number of null cells in the current day schedule.
     * @returns The number of null cells in daySchedule.
     */
    private countCellsToFill(): number {
        let numCellsToFill: number = 0;
        this.currSchedule.forEach(row => {
            row.forEach(activity => {
                if (activity == null) {
                    numCellsToFill += 1;
                }
            })
        });
        return numCellsToFill;
    }

    /**
     * Return whether the current daySchedule is promising. If the current daySchedule is not promsing, it is expected to be pruned.
     * 
     * Discussion:
     * The current criteria for promising assumes each activity is weighted exactly 1. It ensures that only 1 schedule is generated.
     * @returns A boolean indicating whether the current daySchedule is promising.
     */
    private promising(): boolean {
        if (this.bestScore == -Infinity) {
            return true;
        }
        return this.numCellsToFill > Math.abs(this.bestScore - this.currScore);
    }

    /**
     * Recursivley find the best schedule.
     * 
     *  
     * 
     * @link To learn more about dynamic programming see: https://ajzhou.gitlab.io/eecs281/notes/chapter23/
     * 
     * @description The 
     */
    private _genDaySchedule(): void {
        this.iterations++;

        if (this.iterations > this.MAX_ITERATIONS) {
            console.error(`${this._genDaySchedule.name} reached the maximum number of iterations.`)
            return;
        }

        if (!this.promising()) {
            return;
        }

        if (this.numCellsToFill == 0) {
            // start debug
            console.log("=====");
            if (this.currScore < this.bestScore) {
                console.error("There is an issue with pruning. We achieved a schedule with a lower score than the previous best score.");
                return;
            } else {
                console.log("Found a valid schedule!");
                console.log("Previous best score:", this.bestScore);
                console.log("Current best score:", this.currScore);
                console.log(this.currSchedule);
            }
            console.log("=====");
            // end debug

            this.bestScore = this.currScore;
            this.bestSchedule = structuredClone(this.currSchedule);
            return;
        }

        const cell = this.getNextCell();
        let availableActivities = this.getValidActivities(cell);
        availableActivities = availableActivities.sort((a, b) => {
            if (a.multigroup === true && b.multigroup === true) {
                return 0;
            } else if (a.multigroup === true && b.multigroup === false) {
                return -1;
            } else {
                return 1;
            }
        })

        availableActivities.forEach(activity => {
            // set activity
            this.currSchedule[cell.row][cell.col] = activity;
            this.numCellsToFill--;
            this.currScore++;

            this._genDaySchedule();

            // unset activity
            this.currSchedule[cell.row][cell.col] = null;
            this.numCellsToFill++;
            this.currScore--;
        });
    }

    /** A list of available activities to choose from, initalized once */
    private activities: Activity[] = [];
    private daySchedule: DaySchedule;
    private constraints: Constraint[];

    /** Algorithm vars  */
    private currScore: number = 0;
    private bestScore: number = 0;
    private numCellsToFill: number = 0;
    private iterations: number = 0;

    private currSchedule: Schedule = [];
    private bestSchedule: Schedule = [];
}

export default Scheduler;