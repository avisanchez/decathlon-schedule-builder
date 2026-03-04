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

    let [daySchedule, setDaySchedule] = useState<DaySchedule>(s.daySchedule)

    return (
        <>
            <table>
                {
                    daySchedule.map(groupSchedule => {
                        return (
                            <tr>
                                {groupSchedule.map(activity => {
                                    return (
                                        <td>{activity?.code ?? "null"}</td>
                                    )
                                })}
                            </tr>
                        )
                    })
                }
            </table>
            <button onClick={() => {
                console.log("submit")
                s.genDaySchedule();
                setDaySchedule(s.daySchedule);
            }}>Generate Schedule</button>
        </>

    )
}

export default DayScheduleView;