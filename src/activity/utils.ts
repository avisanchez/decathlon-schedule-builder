import activityList from "./activity-list.txt?raw";
import { Activity } from "./types";

export default function getActivities(): Activity[] {
    const lines = activityList.split("\n");

    const activities: Activity[] = lines.map(line => {
        const isSpecial: boolean = line.charAt(line.length - 1) === "*";
        const isMultigroup: boolean = new Set(["CTF", "DGB", "MULTI"]).has(line);
        return { code: line, special: isSpecial, multigroup: isMultigroup };
    })

    return activities;
}