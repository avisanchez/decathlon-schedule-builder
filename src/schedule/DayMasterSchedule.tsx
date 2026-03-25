import { Coordinate, DaySchedule, MultiGroupActivityConstraint, SingleInstanceConstraint, SpecialActivityConstraint, TimeSlot } from "../algo/types";
import getActivities from "../activity/utils";
import { ExcludeGroupsConstraint } from "../algo/types";
import Scheduler from "../algo/Scheduler";
import { ChangeEvent, KeyboardEventHandler, useEffect, useRef, useState } from "react";
import { exportDayScheduleToWorkbook } from "../utils/export";
import { useId } from "react";
import styles from "./DayMasterSchedule.module.css";

function DayMasterSchedule({ daySchedule, readOnly }: { daySchedule: DaySchedule, readOnly?: boolean }) {

    const uniqueId: string = useId();

    const [schedule, setSchedule] = useState<string[][]>(daySchedule.getSchedule().map(row => { return row.map(entry => { return entry ?? "" }) }));

    const [selectedCell, setSelectedCell] = useState<{ cell: Coordinate, editable: boolean, content: string } | null>(null);

    // vars for rendering
    const timeSlots: TimeSlot[] = daySchedule.getTimeSlots();

    // ---------------------
    //         refs
    // ---------------------
    const inputRef = useRef<HTMLInputElement>(null);

    // ---------------------
    //        effects
    // ---------------------
    useEffect(() => {
        console.log(`\n\tselectedCell.cell: (${selectedCell?.cell.row},${selectedCell?.cell.col})\n\tselectedCell.content: ${selectedCell?.content}\n\tselectedCell.editable: ${selectedCell?.editable}`)
    }, [selectedCell]);

    /**
     * This effect is necessary to fix a visual bug where, when a table cell transitioned to the editing state,
     * the input field caret wouldn't show up until the second click.
     * 
     * Solution is credit to ChatGPT.
     */
    useEffect(() => {
        if (selectedCell?.editable === true) {
            requestAnimationFrame(() => { // animation frame synchronizes focus and redraw 
                inputRef.current?.focus();
            });
        }
    }, [selectedCell?.editable]);

    // ------------------------------
    //        helper functions
    // ------------------------------
    // commit the changes of the selected cell
    function commitChanges(): void {
        if (selectedCell !== null) {
            schedule[selectedCell.cell.row][selectedCell.cell.col] = selectedCell.content ?? "";
            setSchedule(schedule);
            // daySchedule.setSchedule(schedule);
        }
    }

    // return whether a given cell is selected
    function isSelected(cell: Coordinate): boolean {
        return selectedCell?.cell.row === cell.row && selectedCell?.cell.col === cell.col;
    }

    function isRowSelected(row: number): boolean {
        return selectedCell?.cell.row === row;
    }

    function isColSelected(col: number): boolean {
        return selectedCell?.cell.col === col;
    }

    function isEditing(cell: Coordinate): boolean {
        return isSelected(cell) && selectedCell?.editable === true;
    }

    // ------------------------------
    //        table callbacks
    // ------------------------------

    // manage inner table cell (<td>) getting clicked
    function onClickTd(row: number, col: number, content: string): void {
        if (readOnly === true) {
            return;
        }
        if (isEditing({ row: row, col: col })) {
            return;
        }
        commitChanges();
        const newSelectedCell: Coordinate = { row: row, col: col };
        const isSameCell = isSelected(newSelectedCell);
        setSelectedCell({ cell: newSelectedCell, editable: isSameCell, content: content });
    }

    function onClickInput(row: number, col: number): void {
        if (!isSelected({ row: row, col: col })) {

        }
    }

    function onChange(e: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
        if (selectedCell === null || selectedCell === undefined) {
            const errorMessage: string = "User is editing a cell when there are none selected.";
            alert(errorMessage)
            throw new Error(errorMessage)
        }
        setSelectedCell({ ...selectedCell, content: e.target.value });
    }

    function handleKeyDown(e: KeyboardEventHandler<HTMLTableElement>): void {

    }

    return (

        <>
            {/* <datalist id="browsers">
                <option value="Edge" />
                <option value="Firefox" />
                <option value="Chrome" />
                <option value="Opera" />
                <option value="Safari" />
            </datalist> */}

            <table
                key={uniqueId}
                className={styles.root}
            >
                <thead>
                    <tr key={`${uniqueId}-col-headers`}>

                        {/* need empty column aligned with the group names */}
                        <th key={`${uniqueId}-col-header-group-name`} />

                        {timeSlots.map((slot, i) => {
                            return (
                                // ---------------------------
                                //          Col Header
                                // --------------------------- 
                                <th key={`${uniqueId}-col-header-time-slot-${i}`}
                                    className={
                                        isColSelected(i) ?
                                            styles.colHeaderSelected :
                                            undefined
                                    }
                                >
                                    {slot.time}
                                </th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody>
                    {schedule.map((groupActivities, i) => {
                        return (
                            <tr key={`${uniqueId}-row-${i}`}>

                                {/* ---------------------------
                                  *          Row Header
                                  * --------------------------- 
                                  */}
                                <td key={`${uniqueId}-row-header-${i}`}
                                    className={
                                        isRowSelected(i) ?
                                            styles.rowHeaderSelected :
                                            undefined
                                    }
                                >
                                    {daySchedule.getGroupName(i)}
                                </td>

                                {
                                    groupActivities.map((activity, j) => {
                                        return (
                                            // ---------------------------
                                            //     Editable Table Cell
                                            // ---------------------------
                                            <td key={`${uniqueId}-cell-${i}-${j}`}
                                                onMouseDown={() => {
                                                    onClickTd(i, j, activity);
                                                }}
                                                className={
                                                    isEditing({ row: i, col: j }) ?
                                                        styles.editing :
                                                        isSelected({ row: i, col: j }) ?
                                                            styles.selected :
                                                            undefined
                                                }
                                            >
                                                {isSelected({ row: i, col: j }) ? (
                                                    <>
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={selectedCell?.content ?? "<ERROR>"}
                                                            onChange={onChange}
                                                            readOnly={!isEditing({ row: i, col: j })}
                                                            list="browsers"
                                                            style={{
                                                                minWidth: 55,
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
                                                    </>

                                                ) : (
                                                    <div style={{ minWidth: 55 }}>
                                                        {activity}
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
        </>
    )
}

export default DayMasterSchedule;