import { Activity } from "../activity/types"
import { Group } from "../group/types"
import { Coordinate, DaySchedule, WeekSchedule } from "./types"
import makeMatrix2D from "./utils";

class Scheduler {
    private NUM_TIME_SLOTS = 5;

    constructor(groups: Group[], activities: Activity[]) {
        this.groups = groups;
        this.activities = activities;
        this.reset();
    }

    /**
     * Set all entries in the day schedule to null
     */
    private reset() {
        this.daySchedule = makeMatrix2D<(Activity | null)>(this.groups.length, this.NUM_TIME_SLOTS, null);
        this.bestSchedule = [];
        this.score = 0;
        this.bestScore = -Infinity;
        this.emptyCells = this.countEmptyCells();
        this.iterations = 0;
    }

    public genDaySchedule(): DaySchedule {
        this.reset();
        this._genDaySchedule();
        return this.bestSchedule;
    }

    /**
     * Get the coordinate of the next cell to fill.
     * 
     * Discussion:
     * The current implementation simply finds the first empty cell from, starting 
     * its search from top left to bottom right.
     * 
     * @returns The coordinate of the next cell to fill.
     */
    private getNextCell(): Coordinate {
        for (let i = 0; i < this.daySchedule.length; ++i) {
            for (let j = 0; j < this.daySchedule[i].length; ++j) {
                if (this.daySchedule[i][j] == null) {
                    return { row: i, col: j };
                }
            }
        }
        console.error(`${this.getNextCell.name} was called when there were no empty cells.`)
        return { row: -1, col: -1 };
    }

    /**
     * Get the available activities for a given group at a given time (i.e. cell). An activity is considered available if it has not been used by the current group, and is not currently being used by another group.
     * @param cell The cell for which to retrieve the available activities.
     * @returns An array of available activities.
     */
    private getAvailableActivities(cell: Coordinate): Activity[] {
        // activities used by this group (aka row)
        const rowActivities: Set<Activity | null> = new Set(this.daySchedule[cell.row]);
        // activities used by other groups in this "timeslot" (aka column)
        const colActivities: Set<Activity | null> = new Set(this.daySchedule.map(row => { return row[cell.col] }))
        return this.activities.filter(activity => {
            return !rowActivities.has(activity) && !colActivities.has(activity);
        });
    }

    /**
     * Get the number of null cells in the current day schedule.
     * @returns The number of null cells in daySchedule.
     */
    private countEmptyCells(): number {
        let numEmptyCells: number = 0;
        this.daySchedule.forEach(row => {
            row.forEach(activity => {
                if (activity == null) {
                    numEmptyCells += 1;
                }
            })
        });
        return numEmptyCells;
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
        return this.emptyCells > Math.abs(this.bestScore - this.score);
    }

    private _genDaySchedule(): void {
        this.iterations++;

        if (this.iterations > 10000) {
            console.error(`${this._genDaySchedule.name} reached the maximum number of iterations.`)
            return;
        }

        if (!this.promising()) {
            return;
        }

        if (this.emptyCells == 0) {
            // start debug
            console.log("=====");
            if (this.score < this.bestScore) {
                console.error("There is an issue with pruning. We achieved a schedule with a lower score than the previous best score.");
                return;
            } else {
                console.log("Found a valid schedule!");
                console.log("Previous best score:", this.bestScore);
                console.log("Current best score:", this.score);
                console.log(this.daySchedule);
            }
            console.log("=====");
            // end debug

            this.bestScore = this.score;
            this.bestSchedule = [...this.daySchedule]
            return;
        }

        const cell = this.getNextCell();
        const availableActivities = this.getAvailableActivities(cell);

        availableActivities.forEach(activity => {
            /** @todo check that activity is valid */
            this.daySchedule[cell.row][cell.col] = activity;
            this.emptyCells--;
            this.score++;
            this._genDaySchedule();
            this.daySchedule[cell.row][cell.col] = null;
            this.emptyCells++;
            this.score--;
        })
    }

    private groups: Group[];
    private activities: Activity[];

    private daySchedule: DaySchedule = [];
    private score: number = 0;
    private bestScore: number = 0;
    private emptyCells: number = 0;
    private iterations: number = 0;

    private bestSchedule: DaySchedule = [];
}

export default Scheduler;