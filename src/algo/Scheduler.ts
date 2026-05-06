import { Activity } from "../activity/types"
import { Group } from "../group/types"
import { Constraint, Coordinate, DaySchedule, Schedule } from "./types"
import { makeMatrix2D } from "./utils";

class Scheduler {
    private MAX_ITERATIONS = 10000;

    constructor() {
        this.daySchedules = [];
        this.activities = [];
        this.constraints = [];
    }

    public init(daySchedules: DaySchedule[], activities: Activity[], constraints: Constraint[]) {
        this.daySchedules = daySchedules;
        this.activities = activities.filter(activity => !activity.special);
        this.constraints = constraints;
    }

    /**
     * Reset all scheduling variables to their inital values.
     */
    private reset() {
        this.currSchedule = this.daySchedules.map(daySchedule => daySchedule.getSchedule());
        this.bestSchedule = [];
        this.currScore = 0;
        this.bestScore = -Infinity;
        this.numCellsToFill = this.countCellsToFill();
        this.iterations = 0;
    }

    public run(): Schedule[] {
        if (this.daySchedules.length === 0) {
            throw new Error("Nothing to be done. It is likely that init() was forgotten.")
        }
        this.reset();
        this.genDaySchedule();
        console.log("The best schedule found was", this.bestSchedule[0]);
        return this.bestSchedule[0];
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
    private getNextCell(): { cell: Coordinate, scheduleIndex: number } {
        for (let i = 0; i < this.currSchedule.length; ++i) {
            for (let j = 0; j < this.currSchedule[i].length; ++j) {
                for (let k = 0; k < this.currSchedule[i][j].length; ++k) {
                    if (this.currSchedule[i][j][k] === null) {
                        return { cell: { row: j, col: k }, scheduleIndex: i }
                    }
                }
            }
        }
        console.error(`${this.getNextCell.name} was called when there were no empty cells.`)
        return { cell: { row: -1, col: -1 }, scheduleIndex: -1 };
    }

    /**
     * Get the valid activities for a given group at a given time (i.e. cell). An activity is considered valid if it has not been used by the current group, and is not currently being used by another group.
     * @param cell The cell for which to retrieve the available activities.
     * @returns An array of available activities.
     */
    private getValidActivities(cell: Coordinate): Activity[] {
        return this.activities.filter(activity => {
            return this.constraints.every(c => c.isValid(activity.code, { day: this.currScheduleIndex, row: cell.row, col: cell.col }, this.daySchedules));
        });
    }

    /**
     * Get the number of null cells in the current day schedule.
     * @returns The number of null cells in daySchedule.
     */
    private countCellsToFill(): number {
        let numCellsToFill: number = 0;
        for (let i = 0; i < this.currSchedule.length; ++i) {
            for (let j = 0; j < this.currSchedule[i].length; ++j) {
                for (let k = 0; k < this.currSchedule[i][j].length; ++k) {
                    if (this.currSchedule[i][j][k] === null) {
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
            console.error(`${this.genDaySchedule.name} reached the maximum number of iterations.`)
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
                console.log(this.currSchedule[this.currScheduleIndex]);
            }
            console.log("=====");
            // end debug

            this.bestScore = this.currScore;
            this.bestSchedule.push(structuredClone(this.currSchedule));
            return;
        }

        const nextCell = this.getNextCell();
        // this is jank, change later
        const cell = nextCell.cell;
        this.currScheduleIndex = nextCell.scheduleIndex;

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
            this.currSchedule[this.currScheduleIndex][cell.row][cell.col] = activity.code;
            this.numCellsToFill--;
            this.currScore++;

            this.genDaySchedule();

            // unset activity
            this.currSchedule[this.currScheduleIndex][cell.row][cell.col] = null;
            this.numCellsToFill++;
            this.currScore--;
        });
    }

    // A list of available activities to choose from, initalized once
    private activities: Activity[] = [];
    private daySchedules: DaySchedule[];
    private constraints: Constraint[];

    /** Algorithm vars  */
    private currScore: number = 0;
    private bestScore: number = 0;
    private numCellsToFill: number = 0;
    private iterations: number = 0;

    private currScheduleIndex: number = -1;
    private currSchedule: Schedule[] = [];
    private bestSchedule: Schedule[][] = [];
}

export default Scheduler;