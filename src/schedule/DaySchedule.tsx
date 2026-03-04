import { useState } from "react";
import getActivities from "../activity/utils"
import Scheduler from "../algo/Scheduler";
import { Gender, Group } from "../group/types"
import { DaySchedule } from "../algo/types";

function DayScheduleView() {
    let groups: Group[] = [];
    for (let i = 0; i < 10; ++i) {
        groups.push({ groupNum: i, isSplit: false, gender: Gender.MALE });
    }
    let activities = getActivities();

    let s = new Scheduler(groups, activities);

    let [daySchedule, setDaySchedule] = useState<DaySchedule>([])

    return (
        <>
            <table>
                <tbody>
                    {
                        daySchedule.map((groupSchedule, i) => {
                            return (
                                <tr key={`${i}`}>
                                    {groupSchedule.map((activity, j) => {
                                        return (
                                            <td key={`${i}-${j}`}>{activity?.code ?? "null"}</td>
                                        )
                                    })}
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
            <button onClick={() => {
                setDaySchedule(s.genDaySchedule());
            }}>Generate Schedule</button>
        </>

    )
}

export default DayScheduleView;