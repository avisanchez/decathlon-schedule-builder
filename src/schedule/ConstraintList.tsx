import { useContext, useEffect, useRef, useState } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { confirm } from "@tauri-apps/plugin-dialog";

/**
 * This type differs from the interface declared in ../algo/types as it is not an interface.
 * The rational behind these two different but overlapping types is that, for purposes of the scheduler
 * we need class defintions to implement the isValid function. However, here we want a data-driver definition
 * of constraints that is well suited for React state updates.
 */
export type Constraint =
    | { type: "empty" }
    | { type: "single" }
    | { type: "mandatory", activity?: string, time?: string }
    | { type: "multi", activity?: string, groupings?: Set<number>[] }
    | { type: "time", activity?: string, validTimes?: Set<string> }
    | { type: "group", activity?: string, allowed?: boolean, groups?: Set<number> }

function ConstraintList() {
    let [constraints, setConstraints] = useState<Constraint[]>([]);
    let [focusIndex, setFocusIndex] = useState<number | null>(null);
    let [hoverIndex, setHoverIndex] = useState<number | null>(null);
    // Reset focus when clicking outside the entire list
    // Credit: Gemini
    const listRef = useRef<HTMLUListElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(e.target as Node)) {
                setFocusIndex(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function isValid(c: Constraint): boolean {
        switch (c.type) {
            case "empty":
                return false;
            case "group":
                return c.groups !== undefined && c.activity !== undefined;
            case "mandatory":
                return c.activity !== undefined && c.time !== undefined;
            case "multi":
                return true; /** @todo: this will have to be more comprehensive later */
            default:
                return false;
        }
    }

    return (
        <div
            style={{
                padding: "10px"
            }}
        >
            <button
                onClick={() =>
                    setConstraints(prev => [{ type: "empty" }, ...prev])
                }
            >
                Add Constraint
            </button>
            <ul
                ref={listRef}
                onClick={() => setFocusIndex(null)}
                style={{
                    width: "fit-content",
                    paddingLeft: "10px",
                    marginTop: "5px"
                }}
            >
                {constraints.map((constraint, i) => {
                    return (
                        <div
                            onClick={(e) => {
                                setFocusIndex(i);
                                e.stopPropagation();
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <div
                                onMouseOver={() => {
                                    setFocusIndex(null);
                                    setHoverIndex(i);
                                }}
                            >
                                {
                                    hoverIndex === i ?
                                        <div
                                            onMouseLeave={() => {
                                                setHoverIndex(null);
                                            }}
                                        >
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const proceed = await confirm("Deleting this constraint cannot be undone. Are you sure you want to proceed?");
                                                    if (!proceed) {
                                                        return;
                                                    }
                                                    setFocusIndex(null);
                                                    setHoverIndex(null);
                                                    setConstraints((prev) => {
                                                        return prev.filter((_, j) => {
                                                            return i !== j;
                                                        })
                                                    })
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        :
                                        <div style={{
                                            width: "10px",
                                            height: "10px",
                                            aspectRatio: "1",
                                            borderRadius: "999px",
                                            background: `color-mix(in srgb, ${isValid(constraint) ? "green" : "red"}, white 40%)`,
                                            border: `1px solid color-mix(in srgb, ${isValid(constraint) ? "green" : "red"}, white 60%)`
                                        }} />
                                }
                            </div>


                            <ConstraintListItem focused={focusIndex === i} constraint={constraint} onChange={(updatedConstraint) => {
                                setConstraints(prev => {
                                    let updatedConstraints = [...prev];
                                    updatedConstraints[i] = updatedConstraint;
                                    return updatedConstraints;
                                });
                            }} />
                        </div>
                    )
                })}
            </ul >
        </div>
    )
}

function ConstraintListItem({ constraint, focused, onChange }: {
    constraint: Constraint,
    focused: boolean,
    onChange?: (updatedConstraint: Constraint) => void
}) {

    const VIEWS = {
        group: <GroupConstraintView
            constraint={constraint}
            readOnly={!focused}
            onChange={(newConstraint) => onChange && onChange(newConstraint)}
        />,
        time: <TimeConstraintView
            constraint={constraint}
            readOnly={!focused}
            onChange={(newConstraint) => onChange && onChange(newConstraint)}
        />,
        multi: <MultiGroupConstraintView
            constraint={constraint}
            readOnly={!focused}
            onChange={(newConstraint) => onChange && onChange(newConstraint)}
        />,
        mandatory: <MandatoryConstraintView
            constraint={constraint}
            readOnly={!focused}
            onChange={(newConstraint) => onChange && onChange(newConstraint)}
        />,
        single: <div>TODO</div>,
        empty: <EmptyConstraintView readOnly={!focused} />
    }

    return (
        <div
            style={{
                display: "flex",
                border: "1px solid rgba(0, 0, 0, 0.16)",
                borderRadius: "5px",
                padding: "10px",
                margin: "10px",
                width: "fit-content"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <select
                    hidden={!focused} value={constraint.type}
                    onChange={async (e) => {
                        const value = e.target.value;
                        if (constraint.type !== "empty") {
                            const proceed = await confirm("The current constraint information will be lost. Do you want to proceed?", { title: "Decathlon Schedule Builder", kind: "warning" });
                            console.log(proceed);
                            if (!proceed) { return; }
                        }
                        console.log(e.target.value)
                        console.log(value)
                        if (onChange) onChange({ type: value as Constraint["type"] });
                    }}
                >
                    <option value={"empty"}></option>
                    <option value={"group"}>Group Membership</option>
                    <option value={"time"}>Time Window</option>
                    <option value={"multi"}>Multi-Group Activity</option>
                    <option value={"mandatory"}>Mandatory Activity</option>
                </select>
            </div>

            <div
                style={{
                    width: "2px",
                    marginLeft: "5px",
                    marginRight: "5px",
                    background: "rgba(0, 0, 0, 0.1)",
                    borderRadius: "999px"
                }}
                hidden={!focused}
            />
            {VIEWS[constraint.type]}
        </div >
    )
}

function EmptyConstraintView({ readOnly }: { readOnly: boolean }) {
    return (
        <div>
            {readOnly ?
                <div
                    style={{
                        opacity: "0.5"
                    }}
                >
                    Empty constraint (click to edit)
                </div>
                :
                <div>

                </div>
            }
        </div>
    )
}

function GroupConstraintView({ readOnly, constraint, onChange }: {
    readOnly?: boolean,
    constraint: Constraint
    onChange?: (newConstraint: Constraint) => void
}) {
    if (constraint.type !== "group") {
        return;
    }

    const { groups, activities, times } = useContext(WorkspaceContext);
    let allGroupNums = groups.flatMap(group => group.isSplit ? [group.groupNum, group.groupNum + 0.5] : group.groupNum);

    return (
        <div
            style={{
                display: "flex",
                gap: "4px",
                whiteSpace: "nowrap",
            }}
        >
            {readOnly ?
                <span
                    style={{
                        fontWeight: "bold"
                    }}
                >{constraint.activity ?? "{Activity}"} </span>
                :
                <select
                    value={constraint.activity}
                    onChange={(e) => {
                        console.log(e.target.value)
                        const newActivity = e.target.value === "" ? undefined : e.target.value;
                        if (onChange) onChange({ ...constraint, activity: newActivity });
                    }}
                >
                    <option value={undefined}></option>
                    {
                        activities.map(activity => {
                            return (
                                <option value={activity.code}>{activity.code}</option>
                            )
                        })
                    }
                </select>
            }
            <span
                style={{
                    alignContent: "center"
                }}
            > is </span>

            {readOnly ?
                <span
                    style={{
                        fontWeight: "bold"
                    }}
                >{constraint.allowed === undefined ? "{allowed/not allowed}" : constraint.allowed ? "only allowed" : "not allowed"}</span>
                :

                <select
                    value={`${constraint.allowed}`}
                    onChange={(e) => {
                        const newAllowedValue = e.target.value === "" ? undefined : e.target.value === "true";
                        if (onChange) onChange({ ...constraint, allowed: newAllowedValue });
                    }}
                >
                    <option value={undefined} />
                    <option value={"true"}>only allowed</option>
                    <option value={"false"}>not allowed</option>
                </select>

            }

            <span
                style={{
                    alignContent: "center"
                }}
            >for group{constraint.groups?.size === 1 && readOnly ? "" : "s"}: </span>

            {readOnly ?
                <div
                    style={{
                        fontWeight: "bold"
                    }}
                >{[...constraint.groups ?? []].sort((a, b) => a - b).join(", ")}</div>
                :
                <div
                    style={{
                        display: "flex"
                    }}
                >
                    {allGroupNums.map(groupNum => {
                        const selected: boolean = constraint.groups?.has(groupNum) ?? false;
                        return (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "5px",
                                    padding: "3px",
                                    textAlign: "center",
                                    alignItems: "center",
                                    border: "1px solid rgba(0, 0, 0, 0.17)",
                                    marginRight: "5px",
                                    background: selected ? "rgba(0,0,0,0.1)" : "transparent"
                                }}
                                onClick={() => {
                                    let newGroups = constraint.groups ?? new Set<number>();
                                    if (selected) {
                                        newGroups?.delete(groupNum);
                                    } else {
                                        newGroups?.add(groupNum);
                                    }
                                    if (onChange) onChange({ ...constraint, groups: newGroups })
                                }}
                            >
                                {groupNum}
                            </div>
                        )
                    })}
                </div>
            }

        </div>
    )
}

function TimeConstraintView({ readOnly, constraint, onChange }: {
    constraint: Constraint
    readOnly: boolean
    onChange: (updatedConstraint: Constraint) => void
}) {
    if (constraint.type !== "time") {
        return;
    }

    const { groups, activities, times } = useContext(WorkspaceContext);

    return (
        <div>
            {
                readOnly ?
                    <span
                        style={{
                            fontWeight: "bold"
                        }}
                    >{constraint.activity ?? "{Activity}"}</span>
                    :
                    <select
                        value={constraint.activity}
                        onChange={(e) => {
                            if (onChange) onChange({ ...constraint, activity: e.target.value });
                        }}
                    >
                        <option value={""} />
                        {
                            activities.map(activity => {
                                return (
                                    <option value={activity.code}>
                                        {activity.code}
                                    </option>
                                )
                            })
                        }
                    </select>
            }
            <span> happens </span>

            <select>
                <option>before</option>
                <option>at or before</option>
                <option>after</option>
                <option>at or after</option>
            </select>

            <select>
                {times.map(time => {
                    return (
                        <option>
                            {time}
                        </option>
                    )
                })}
            </select>
        </div>
    )
}

function MultiGroupConstraintView({ readOnly, constraint, onChange }: {
    constraint: Constraint,
    readOnly?: boolean,
    onChange?: (updatedConstraint: Constraint) => void
}) {
    if (constraint.type !== "multi") {
        return;
    }
    const { groups, activities, times } = useContext(WorkspaceContext);

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const MAX_META_GROUPS = ALPHABET.length;
    const expandedGroups = groups.flatMap(group => group.isSplit ? [group.groupNum, group.groupNum + 0.5] : [group.groupNum]);
    let groupings = constraint.groupings;

    if (groupings === undefined) {
        groupings = Array.from({ length: MAX_META_GROUPS }, (_, i) => i === 0 ? new Set(expandedGroups) : new Set());
        if (onChange) onChange({ ...constraint, groupings: groupings });
        return;
    }

    return (
        <div style={{
            display: "flex",
            overflow: "scroll",
            gap: "4px",
            flexDirection: "column"
        }}>
            <div>
                {
                    readOnly ?
                        <span
                            style={{
                                fontWeight: "bold"
                            }}
                        >
                            {constraint.activity ?? "{Activity}"}
                        </span>
                        :
                        <select
                            value={constraint.activity}
                            onChange={(e) => {
                                const newActivity = e.target.value === "" ? undefined : e.target.value;
                                if (onChange) onChange({ ...constraint, activity: newActivity });
                            }}
                        >
                            <option value={""}></option>
                            {activities.map(activity => {
                                return (
                                    <option value={activity.code}>{activity.code}</option>
                                )
                            })}
                        </select>
                }
                <span> is multi-group </span>
            </div>
            <div
                style={{
                    display: "flex"
                }}
            >
                {
                    groupings.map((grouping, i) => {
                        if (grouping.size === 0) {
                            return <div />
                        }
                        return (
                            <div>
                                <div>
                                    <h3
                                        style={{
                                            margin: "0px",
                                            textAlign: "center"
                                        }}
                                        hidden={readOnly}
                                    >
                                        {ALPHABET.charAt(i)}
                                    </h3>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: `repeat(${grouping.size / 2}, 1fr)`,
                                            gap: "10px",
                                            width: "fit-content",
                                            height: "fit-content",
                                            whiteSpace: "nowrap",
                                            background: "rgba(0, 0, 0, 0.03)",
                                            border: "1px solid rgba(0, 0, 0, 0.12)",
                                            margin: "5px",
                                            padding: "10px", borderRadius: "5px",
                                        }}
                                    >
                                        {[...grouping].sort((a, b) => { return a - b }).map(group => {
                                            return (
                                                <div>
                                                    Group {group}
                                                    <select
                                                        hidden={readOnly}
                                                        value={ALPHABET.charAt(i)}
                                                        onChange={(e) => {
                                                            const currMetaGroupIndex = i;
                                                            const newMetaGroupIndex = ALPHABET.indexOf(e.target.value);
                                                            if (newMetaGroupIndex < 0) {
                                                                return console.error("Cannot find grouping");
                                                            }
                                                            const newGroupings = [...groupings];
                                                            if (newGroupings[currMetaGroupIndex].delete(group) === false) {
                                                                console.log("newGroupings", newGroupings);
                                                                console.log("currMetaGroupIndex: ", currMetaGroupIndex);
                                                                return console.error("Group did not exist in expected meta-group");
                                                            }
                                                            newGroupings[newMetaGroupIndex].add(group);
                                                            if (onChange) onChange({ ...constraint, groupings: newGroupings });
                                                        }}
                                                    >
                                                        {
                                                            ALPHABET.split("").map(letter => {
                                                                return (
                                                                    <option value={letter}>
                                                                        {letter}
                                                                    </option>
                                                                )
                                                            })
                                                        }
                                                    </select>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                        )
                    })
                }
            </div>
        </div >
    )
}

function MandatoryConstraintView({ readOnly, constraint, onChange }: {
    constraint: Constraint,
    readOnly?: boolean,
    onChange?: (updatedConstraint: Constraint) => void
}) {
    if (constraint.type !== "mandatory") {
        return;
    }
    const { groups, activities, times } = useContext(WorkspaceContext);

    return (
        <div>
            <span>All groups have </span>
            {
                readOnly ?
                    <span
                        style={{
                            fontWeight: "bold"
                        }}
                    >{constraint.activity ?? "{activity}"}</span>
                    :
                    <select
                        value={constraint.activity}
                        onChange={(e) => {
                            const newActivity = e.target.value === "" ? undefined : e.target.value;
                            if (onChange) onChange({ ...constraint, activity: newActivity });
                        }}
                    >
                        <option value={""} />
                        {
                            activities.map(activity => {
                                return (
                                    <option value={activity.code}>
                                        {activity.code}
                                    </option>
                                )
                            })
                        }
                    </select>
            }
            <span> at </span>
            {
                readOnly ?
                    <span
                        style={{
                            fontWeight: "bold"
                        }}
                    >{constraint.time ?? "{time}"}</span>
                    :
                    <select
                        value={constraint.time ?? ""}
                        onChange={(e) => {
                            const newTime = e.target.value === "" ? undefined : e.target.value;
                            if (onChange) onChange({ ...constraint, time: newTime });
                        }}
                    >
                        <option value={""} />
                        {
                            times.map(time => {
                                return (
                                    <option>
                                        {time}
                                    </option>
                                )
                            })
                        }
                    </select>
            }
        </div>
    )
}


export default ConstraintList;