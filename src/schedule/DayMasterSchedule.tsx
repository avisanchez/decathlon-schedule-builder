import { Coordinate, DaySchedule, MultiGroupActivityConstraint, SingleInstanceConstraint, SpecialActivityConstraint } from "../algo/types";
import getActivities from "../activity/utils";
import { ExcludeGroupsConstraint } from "../algo/types";
import Scheduler from "../algo/Scheduler";
import { useState } from "react";
import { exportDayScheduleToWorkbook } from "../utils/export";

function DayMasterSchedule({ title, daySchedule }: { title: string, daySchedule: DaySchedule }) {

    const youngerGroups = new Set([1, 2, 3, 4, 11, 12, 13]);
    const olderGroups = new Set(daySchedule.getGroups().map(g => { return g.groupNum }).filter(g => { return !youngerGroups.has(Math.floor(g)) }))
    let c1 = new ExcludeGroupsConstraint(new Map<string, Set<number>>([
        ["PG", olderGroups],
        ["GAGA1", olderGroups],
        ["GAGA2", youngerGroups],
        ["BK1", olderGroups],
        ["BK2", youngerGroups],
        ["WB1", olderGroups],
        ["WB2", youngerGroups]
    ]));
    let c2 = new SingleInstanceConstraint();
    let c3 = new SpecialActivityConstraint();
    let c4 = new MultiGroupActivityConstraint(new Map<string, Set<number>[]>([
        ["CTF", [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set([7, 8, 9, 10]), new Set([11, 12, 13]), new Set([14, 15, 16])]],
        ["DGB", [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set([7, 8, 9, 10]), new Set([11, 12, 13]), new Set([14, 15, 16])]],
        ["MULTI", [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set([7, 8, 9, 10]), new Set([11, 12, 13]), new Set([14, 15, 16])]]
    ]));

    let activities = getActivities();
    let s = new Scheduler(daySchedule, activities, [c1, c2, c3, c4]);

    let [schedule, setSchedule] = useState(daySchedule.getSchedule());

    let [selectedCell, setSelectedCell] = useState<{ cell: Coordinate, editable: boolean, content: string | null }>();

    return (
        <>
            <h2>{title}</h2>
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
                                                if (selectedCell !== undefined) {
                                                    schedule[selectedCell.cell.row][selectedCell.cell.col] = { code: selectedCell.content ?? "NO_CODE" }
                                                    setSchedule(schedule);
                                                    daySchedule.setSchedule(schedule);
                                                }
                                                const newSelectedCell = { row: i, col: j }
                                                setSelectedCell(prev => { return { cell: newSelectedCell, editable: prev?.cell.row === newSelectedCell.row && prev.cell.col === newSelectedCell.col, content: activity?.code ?? null } })
                                            }}
                                                style={{ background: selectedCell?.cell.row === i && selectedCell.cell.col === j ? "red" : "none" }}
                                            >
                                                {selectedCell?.cell?.row == i && selectedCell.cell?.col == j ? (
                                                    <input
                                                        type="text"
                                                        value={selectedCell.content ?? ""}
                                                        onChange={(e) => { setSelectedCell({ ...selectedCell, content: e.target.value }) }}
                                                        style={{
                                                            minWidth: 50,
                                                            width: "100%",
                                                            boxSizing: "border-box",
                                                            border: "none",
                                                            padding: 0,
                                                            margin: 0,
                                                            font: "inherit",
                                                            background: "transparent",
                                                            fieldSizing: "content"
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ minWidth: 50 }}>
                                                        {activity?.code ?? ""}
                                                    </div>
                                                )}
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
                exportDayScheduleToWorkbook(daySchedule);
            }
            }>Generate Schedule</button>
        </>

    )
}

export default DayMasterSchedule;