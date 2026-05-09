import { Constraint } from "./schedule/ConstraintList";
import { Activity, Group } from "./types";

export const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const weekdayAbbrs = ["M", "T", "W", "Th", "F"]
export const defaultTimeSlots = ["9:30", "10:15", "10:30", "11:15", "12:00", "1:10", "1:50", "2:30", "2:45"];
export const defaultGroups: Group[] = Array.from({ length: 16 }, (_, i) => (
    {
        groupNum: i + 1,
        isSplit: false
    }
));
export const defaultConstraints: Constraint[] = [
    { type: "time", activity: "CTF", relative: "before", time: "12:00" },
    { type: "time", activity: "T&C", relative: "after", time: "12:00" },
    { type: "time", activity: "T&C", relative: "before", time: "2:30" },
    { type: "mandatory", activity: "SNACK", time: "10:15" },
    { type: "mandatory", activity: "LUNCH", time: "12:00" },
    { type: "mandatory", activity: "REST/POPS", time: "2:30" },
    { type: "regular" },
    { type: "single" }
]

export const defaultActivities: Activity[] = [
    { code: "A&C", name: "Arts and Crafts" },
    { code: "BG", name: "Board Game Room" },
    { code: "BK1", name: "Basketball (Low Hoops)" },
    { code: "BK2", name: "Basketball (Normal Hoops)" },
    { code: "BKT", name: "Basketball Tournament" },
    { code: "BT", name: "Black Top Games" },
    { code: "CTF", name: "Capture the Flag", multigroup: true },
    { code: "DGB", name: "Dodgeball Arena", multigroup: true },
    { code: "FR", name: "Frisbee" },
    { code: "FB", name: "Football" },
    { code: "GAGA1", name: "Gagaball (Wood Court)" },
    { code: "GAGA2", name: "Gagaball (Fence Court)" },
    { code: "HK", name: "Hockey" },
    { code: "LA", name: "Last Activity", special: true },
    { code: "MULTI", name: "Multipurpose Room", multigroup: true },
    { code: "OR", name: "Orientation", special: true },
    { code: "PB", name: "Pickleball" },
    { code: "PG", name: "Playground" },
    { code: "PP", name: "Ping Pong Room" },
    { code: "ROCH", name: "Rochambeau Tournament", special: true },
    { code: "SOC", name: "Soccer" },
    { code: "ST", name: "Soccer Tournament", special: true },
    { code: "T&C", name: "Throw and Catch", special: true },
    { code: "TH", name: "Team Handball" },
    { code: "TTHOF", name: "Taste test/Hall of Fame", special: true },
    { code: "TUG", name: "Tug of War", special: true },
    { code: "VB", name: "Volleyball" },
    { code: "WALL", name: "Wall Ball" },
    { code: "WB1", name: "Whiffleball (Small Field)" },
    { code: "WB2", name: "Whiffleball (Big Field)" },
    { code: "SNACK", name: "Snack Break", special: true },
    { code: "LUNCH", name: "Lunch Break", special: true },
    { code: "REST/POPS", name: "Popsicle Break", special: true }
]