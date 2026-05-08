import {
    DayScheduleCoordinate,
    DayScheduleIndex,
    DaySchedule
} from "../types";
import {
    ChangeEvent,
    useEffect,
    useRef,
    useState,
    useId
} from "react";
import styles from "./DayMasterSchedule.module.css";

type TableCell = {
    cell: DayScheduleCoordinate
    editable: boolean
    content: string | null
}

function DayMasterSchedule({ dayScheduleIndex, setDayScheduleIndex, readOnly, searchterm }: {
    dayScheduleIndex: DayScheduleIndex,
    setDayScheduleIndex: (dayScheduleIndex: DayScheduleIndex) => void,
    readOnly?: boolean,
    searchterm?: string
}) {
    const uniqueId: string = useId(); // for key generation

    const [anchorCell, setAnchorCell] = useState<TableCell | null>(null);
    const [selectedCells, setSelectedCells] = useState<Set<DayScheduleCoordinate>>(new Set());

    // vars for rendering
    const timeSlots: string[] = dayScheduleIndex.getTimeSlots();
    const schedule: DaySchedule = dayScheduleIndex.getSchedule();

    // ---------------------
    //         refs
    // ---------------------
    const inputRef = useRef<HTMLInputElement>(null);

    // ---------------------
    //        effects
    // ---------------------

    // debug the selected cell
    useEffect(() => {
        console.log(`\n\tselectedCell.cell: (${anchorCell?.cell.row},${anchorCell?.cell.col})\n\tselectedCell.content: ${anchorCell?.content}\n\tselectedCell.editable: ${anchorCell?.editable}`)
    }, [anchorCell]);

    /**
     * This effect is necessary to fix a visual bug where, when a table cell transitioned to the editing state,
     * the input field caret wouldn't show up until the second click.
     * 
     * Solution is credit to ChatGPT.
     */
    useEffect(() => {
        if (anchorCell?.editable === true) {
            requestAnimationFrame(() => { // animation frame synchronizes focus and redraw 
                inputRef.current?.focus();
            });
        }
    }, [anchorCell?.editable]);

    // synchronize 
    useEffect(() => {
        if (!anchorCell) {
            return;
        }
        if (anchorCell.content !== schedule[anchorCell.cell.row][anchorCell.cell.col]) {
            setDayScheduleIndex(dayScheduleIndex);
        }
    }, [anchorCell?.content]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== "Delete" && e.key !== "Backspace") return;

            // Ignore if user is editing
            if (document.activeElement instanceof HTMLInputElement) return;

            if (!anchorCell) return;

            setAnchorCell({ ...anchorCell, content: null })
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [anchorCell?.cell]); // important dependency

    // ------------------------------
    //        helper functions
    // ------------------------------
    // commit the changes of the selected cell
    function commitChanges(): void {
        if (anchorCell !== null) {
            dayScheduleIndex.getSchedule()[anchorCell.cell.row][anchorCell.cell.col] = anchorCell.content;
            setDayScheduleIndex(dayScheduleIndex);
        }
    }

    // return whether a given cell is selected
    function isSelected(cell: DayScheduleCoordinate): boolean {
        if (selectedCells.has(cell)) {
            return true;
        }
        return anchorCell?.cell.row === cell.row && anchorCell?.cell.col === cell.col;
    }

    function isRowSelected(row: number): boolean {
        return anchorCell?.cell.row === row;
    }

    function isColSelected(col: number): boolean {
        return anchorCell?.cell.col === col;
    }

    function isEditing(cell: DayScheduleCoordinate): boolean {
        return isSelected(cell) && anchorCell?.editable === true;
    }

    // ------------------------------
    //        table callbacks
    // ------------------------------

    // manage inner table cell (<td>) getting clicked
    function onClickTd(row: number, col: number, content: string | null): void {
        if (readOnly === true) {
            return;
        }
        if (isEditing({ row: row, col: col })) {
            return;
        }
        commitChanges();
        const newSelectedCell: DayScheduleCoordinate = { row: row, col: col };
        const isSameCell = isSelected(newSelectedCell);
        setAnchorCell({ cell: newSelectedCell, editable: isSameCell, content: content === "" ? null : content });
    }

    function onChange(e: ChangeEvent<HTMLInputElement, HTMLInputElement>): void {
        if (anchorCell === null || anchorCell === undefined) {
            const errorMessage: string = "User is editing a cell when there are none selected.";
            alert(errorMessage)
            throw new Error(errorMessage)
        }
        setAnchorCell({ ...anchorCell, content: e.target.value });
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
                tabIndex={0}
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
                                    onClick={() => {
                                        console.log("Clicked table header");
                                        setSelectedCells(new Set([{ row: 0, col: i }]));
                                    }}
                                >
                                    {slot}
                                </th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody>
                    {schedule.map((groupActivities, i) => {
                        return (
                            <tr key={`${uniqueId}-row-${i}`}>

                                {
                                    // ---------------------------
                                    //          Row Header
                                    // --------------------------- 
                                }
                                <td key={`${uniqueId}-row-header-${i}`}
                                    className={
                                        isRowSelected(i) ?
                                            styles.rowHeaderSelected :
                                            undefined
                                    }
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    {dayScheduleIndex.getGroupName(i)}
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
                                                style={searchterm && searchterm === activity
                                                    ? { background: "yellow" }
                                                    : undefined
                                                }
                                            >
                                                {anchorCell && isSelected({ row: i, col: j }) ? (
                                                    <>
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={anchorCell.content ?? ""}
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
                                                        {activity ?? ""}
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

            {/* DEBUG */}
            {/* <button onClick={() => { console.log(daySchedule.getSchedule()) }}>
                print schedule
            </button> */}
        </>
    )
}

export default DayMasterSchedule;