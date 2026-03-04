import activityList from "./activity-list.txt?raw";
import { Activity } from "./types";

export default function getActivities(): Activity[] {
    const lines = activityList.split("\n");

    const activities: Activity[] = lines.map(line => {
        return { code: line }
    })

    return activities;
}