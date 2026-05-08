import { Activity, DayScheduleIndex, WeekSchedule, WeekScheduleCoordinate } from "../types"
import { Constraint } from "../schedule/ConstraintList";
import { isValid } from "./utils";

/**
 * The scheduler class manages the task of scheduling activities.
 * It is capable of handling one or more day schedules simultaneously 
 * that may or may not be partially filled out.
 * 
 * usage: 
 * 1) Create an instance of the schedule | const s = new Scheduler();
 * 2) Initalize the scheduler with the relevant parameters | s.init(...)
 * 3) Call run to generate the best schedule | const bestSchedule = s.run()
 * 
 */
class Scheduler {
    private MAX_ITERATIONS = 10000;

    constructor() {
        this.weekIndex = [];
        this.activities = [];
        this.constraints = [];
    }

    public init(weekIndex: DayScheduleIndex[], activities: Activity[], constraints: Constraint[]) {
        this.weekIndex = weekIndex;
        this.activities = activities;
        this.constraints = constraints;
    }

    public run(): WeekSchedule {
        if (this.weekIndex.length === 0) {
            throw new Error("Nothing to be done. It is likely that init() was forgotten.")
        }
        this.reset();
        this.genDaySchedule();
        console.log("The best schedule found was", this.bestWeekSchedule);
        return this.bestWeekSchedule;
    }

    /**
     * Reset all scheduling variables to their inital values.
     */
    private reset() {
        this.weekSchedule = this.weekIndex.map(dayIndex => dayIndex.getSchedule());
        this.bestWeekSchedule = [];
        this.currScore = 0;
        this.bestScore = -Infinity;
        this.numCellsToFill = this.countCellsToFill();
        this.iterations = 0;
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
    private getNextCell(): WeekScheduleCoordinate | null {
        for (let i = 0; i < this.weekSchedule.length; ++i) {
            for (let j = 0; j < this.weekSchedule[i].length; ++j) {
                for (let k = 0; k < this.weekSchedule[i][j].length; ++k) {
                    if (this.weekSchedule[i][j][k] === null) {
                        return { day: i, row: j, col: k };
                    }
                }
            }
        }
        console.error(`${this.getNextCell.name} found no empty cells.`)
        return null;
    }

    /**
     * Get the valid activities for a given group at a given time (i.e. cell). An activity is considered valid if it has not been used by the current group, and is not currently being used by another group.
     * @param cell The cell for which to retrieve the available activities.
     * @returns An array of available activities.
     */
    private getValidActivities(cell: WeekScheduleCoordinate): Activity[] {
        let validActivities: Activity[] = [];

        for (let i = 0; i < this.activities.length; ++i) {
            const activity = this.activities[i];
            let valid = activity.special !== true; // sneaky error: this used to be activity.special === false, but since it could also be undefined the comparison would fail
            for (let j = 0; j < this.constraints.length; ++j) {
                const constraint = this.constraints[j];

                // deal with fuckass mandatory constraints differntly
                if (constraint.type === "mandatory") {
                    const applicable = constraint.time === this.weekIndex[cell.day].getTime(cell.col);
                    if (applicable) {
                        if (constraint.activity === activity.code) {
                            return [{ code: activity.code ?? "[ERROR]" }]
                        }
                    }
                }
                const passed = isValid(constraint, activity, cell, this.weekIndex);
                valid = valid && passed;
            }
            if (valid) validActivities.push(activity);
        }
        return validActivities;
    }

    /**
     * Get the number of null cells in the current day schedule.
     * @returns The number of null cells in daySchedule.
     */
    private countCellsToFill(): number {
        let numCellsToFill: number = 0;
        for (let i = 0; i < this.weekSchedule.length; ++i) {
            for (let j = 0; j < this.weekSchedule[i].length; ++j) {
                for (let k = 0; k < this.weekSchedule[i][j].length; ++k) {
                    if (this.weekSchedule[i][j][k] === null) {
                        numCellsToFill += 1;
                    }
                }
            }
        }
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

    private shuffle<T>(array: T[]) {
        for (let i = array.length - 1; i > 0; i--) {
            // Generate a random index from 0 to i
            const j = Math.floor(Math.random() * (i + 1));

            // Swap elements array[i] and array[j] using destructuring
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
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
    private genDaySchedule(): void {
        this.iterations++;

        if (this.iterations > this.MAX_ITERATIONS) {
            this.bestWeekSchedule = structuredClone(this.weekSchedule);
            console.error(`${this.genDaySchedule.name} reached the maximum number of iterations.`)
            return;
        }

        if (!this.promising()) {
            return;
        }

        if (this.numCellsToFill == 0) {
            this.bestScore = this.currScore;
            this.bestWeekSchedule = structuredClone(this.weekSchedule);
            return;
        }

        const cell = this.getNextCell();

        if (cell === null) {
            return console.error("Something went wrong. Attempting to run genDaySchedule when there are no free cells to fill.");
        }

        let availableActivities = this.getValidActivities(cell);
        if (availableActivities.length === 0) { return console.error("found no valid activities"); }
        this.shuffle(availableActivities);
        // availableActivities = availableActivities.sort((a, b) => {
        //     if (a.multigroup === true && b.multigroup === true) {
        //         return 0;
        //     } else if (a.multigroup === true && b.multigroup === false) {
        //         return -1;
        //     } else {
        //         return 1;
        //     }
        // })

        availableActivities.forEach(activity => {
            if (this.iterations > this.MAX_ITERATIONS) { return; }
            // set activity
            this.weekSchedule[cell.day][cell.row][cell.col] = activity.code;
            this.numCellsToFill--;
            this.currScore++;

            this.genDaySchedule();

            // unset activity
            this.weekSchedule[cell.day][cell.row][cell.col] = null;
            this.numCellsToFill++;
            this.currScore--;
        });
    }

    // A list of available activities to choose from, initalized once
    private activities: Activity[] = [];
    private weekIndex: DayScheduleIndex[];
    private constraints: Constraint[];

    /** Algorithm vars  */
    private currScore: number = 0;
    private bestScore: number = 0;
    private numCellsToFill: number = 0;
    private iterations: number = 0;

    private weekSchedule: WeekSchedule = [];
    private bestWeekSchedule: WeekSchedule = [];
}

export default Scheduler;