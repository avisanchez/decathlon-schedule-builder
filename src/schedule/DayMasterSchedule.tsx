import { Coordinate, DaySchedule } from "../algo/types";
import getActivities from "../activity/utils";
import { ExcludeGroupsConstraint } from "../algo/types";
import Scheduler from "../algo/Scheduler";
import { useState } from "react";

function DayMasterSchedule({ daySchedule }: { daySchedule: DaySchedule }) {

    let ageRestriction = new ExcludeGroupsConstraint(new Map<string, Set<number>>([
        ["A&C", new Set([1])]
    ]));

    let activities = getActivities();
    let s = new Scheduler(daySchedule, activities, [ageRestriction]);

    let [schedule, setSchedule] = useState(daySchedule.getSchedule());

    let [editableCell, setEditableCell] = useState<Coordinate>();

    return (
        <>
            <table>
                <thead>
                    <tr key={"column-headers"}>
                        <th />
                        {daySchedule.slots.map(slot => {
                            return (
                                <th key={slot.time}>{slot.time}</th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody>
                    {schedule.map((groupActivities, i) => {
                        return (
                            <tr key={i}>
                                <td key={`row-header-${i}`}>{daySchedule.groupName(i)}</td>
                                {
                                    groupActivities.map((activity, j) => {
                                        return (
                                            <td key={`cell-${i}-${j}`} onClick={() => {
                                                // commit previous changes

                                                setEditableCell({ row: i, col: j });
                                            }}>
                                                <input
                                                    type="text"
                                                    readOnly={!(editableCell?.row == i && editableCell?.col == j)}
                                                    value={activity?.code ?? "null"}
                                                    style={{ minWidth: 50, fieldSizing: "content" }}
                                                />
                                            </td>
                                        )
                                    })
                                }
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <button onClick={() => {
                let newSchedule = s.genDaySchedule();
                setSchedule(newSchedule);
            }
            }>Generate Schedule</button>
        </>

    )
}

export default DayMasterSchedule;