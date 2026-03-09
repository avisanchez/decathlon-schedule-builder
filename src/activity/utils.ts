import activityList from "./activity-list.txt?raw";
import { Activity } from "./types";

export default function getActivities(): Activity[] {
    const lines = activityList.split("\n");

    const activities: Activity[] = lines.map(line => {
        const isSpecial: boolean = line.charAt(line.length - 1) === "*";
        return { code: line, special: isSpecial };
    })

    return activities;
}