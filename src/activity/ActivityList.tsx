// Display a list of the available activities to choose from
import activityList from "./activity-list.txt?raw";
import { Activity } from "./types";

function ActivityList() {

    const lines = activityList.split("\n");

    const activities: Activity[] = lines.map(line => {
        return { code: line }
    })

    return (
        <ul>
            {activities.map(activity => {
                return (
                    <li key={activity.code}>
                        {activity.code}
                    </li>
                )
            })}
        </ul>
    )
}

export default ActivityList;