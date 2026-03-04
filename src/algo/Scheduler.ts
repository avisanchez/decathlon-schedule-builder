import { Activity } from "../activity/types"
import { Group } from "../group/types"
import { DaySchedule, WeekSchedule } from "./types"

class Scheduler {
    constructor(groups: Group[], activities: Activity[]) {
        this.groups = groups
        this.activities = activities

        // initalize the day schedule - note that we are hardcoding time slots here
        const NUM_TIME_SLOTS = 5
        this.daySchedule = new Array(groups.length)
        for (let i = 0; i < this.daySchedule.length; ++i) {
            this.daySchedule[i] = new Array(NUM_TIME_SLOTS).fill(null)
        }

        console.log(this.daySchedule)
    }

    public daySchedule: DaySchedule = [];
    public done: boolean = false;

    private fillNextSlot(): void {
        for (let i = 0; i < this.daySchedule.length; ++i) {
            for (let j = 0; j < this.daySchedule[i].length; ++j) {
                if (this.daySchedule[i][j] == null) {
                    this.daySchedule[i][j] = this.activities[Math.floor(Math.random() * this.activities.length)]
                    return;
                }
            }
        }
    }

    public genDaySchedule(): void {
        if (this.done) {
            return;
        }

        this.fillNextSlot();

        // update done
        this.done = true;
        this.daySchedule.forEach(row => {
            row.forEach(activity => {
                if (activity == null) {
                    this.done = false;
                }
            })
        });

        this.genDaySchedule();
    }

    private groups: Group[]
    private activities: Activity[]
}

export default Scheduler;