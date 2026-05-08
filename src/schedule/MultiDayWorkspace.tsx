import { useEffect, useState } from "react";
import DayMasterSchedule from "./DayMasterSchedule";
import { Group, Activity, DayScheduleIndex } from "../types";
import Scheduler from "../algo/Scheduler";
import { exportWeekToWorkbook } from "../utils/export";
import ActivitySettings from "./ActivitySettings";
import GroupSettings from "./GroupSettings";
import ConstraintList, { Constraint } from "./ConstraintList";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { confirm } from "@tauri-apps/plugin-dialog";

// constants
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekdayAbbrs = ["M", "T", "W", "Th", "F"]
const defaultTimeSlots = ["9:30", "10:15", "10:30", "11:15", "12:00", "1:10", "1:50", "2:30", "2:45"];
const defaultGroups: Group[] = Array.from({ length: 16 }, (_, i) => (
    {
        groupNum: i + 1,
        isSplit: false
    }
));
const defaultConstraints: Constraint[] = [
    { type: "mandatory", activity: "SNACK", time: "10:15" },
    { type: "mandatory", activity: "LUNCH", time: "12:00" },
    { type: "mandatory", activity: "REST/POPS", time: "2:30" },
    { type: "regular" },
    { type: "single" }
]

const defaultActivities: Activity[] = [
    { code: "A&C", name: "Arts and Crafts" },
    { code: "BG", name: "Board Game Room" },
    { code: "BK1", name: "Basketball (Low Hoops)" },
    { code: "BK2", name: "Basketball (Normal Hoops)" },
    { code: "BKT", name: "Basketball Tournament" },
    { code: "BT", name: "Black Top Games" },
    { code: "CTF", name: "Capture the Flag", multigroup: true },
    { code: "DGB", name: "Dodgeball Arena", multigroup: true },
    { code: "FR", name: "Frisbee" },
    { code: "FB", name: "Football" },
    { code: "GAGA1", name: "Gagaball (Wood Court)" },
    { code: "GAGA2", name: "Gagaball (Fence Court)" },
    { code: "HK", name: "Hockey" },
    { code: "LA", name: "Last Activity", special: true },
    { code: "MULTI", name: "Multipurpose Room", multigroup: true },
    { code: "OR", name: "Orientation", special: true },
    { code: "PB", name: "Pickleball" },
    { code: "PG", name: "Playground" },
    { code: "PP", name: "Ping Pong Room" },
    { code: "ROCH", name: "Rochambeau Tournament", special: true },
    { code: "SOC", name: "Soccer" },
    { code: "ST", name: "Soccer Tournament", special: true },
    { code: "T&C", name: "Throw and Catch" },
    { code: "TH", name: "Team Handball" },
    { code: "TTHOF", name: "Taste test/Hall of Fame", special: true },
    { code: "TUG", name: "Tug of War", special: true },
    { code: "VB", name: "Volleyball" },
    { code: "WALL", name: "Wall Ball" },
    { code: "WB1", name: "Whiffleball (Small Field)" },
    { code: "WB2", name: "Whiffleball (Big Field)" },
    { code: "SNACK", name: "Snack Break", special: true },
    { code: "LUNCH", name: "Lunch Break", special: true },
    { code: "REST/POPS", name: "Popsicle Break", special: true }
]


function MultiDayWorkspace() {

    // state
    let [workspace, setWorkspace] = useState({ groups: defaultGroups, activities: defaultActivities, times: defaultTimeSlots });
    let [weekIndex, setWeekIndex] = useState<DayScheduleIndex[]>(
        Array.from({ length: 5 }, () =>
            new DayScheduleIndex(workspace.groups, workspace.times)
        )
    );

    // allow for collapsable day schedules
    let [visibleSchedules, setVisibleSchedules] = useState<boolean[]>(new Array(weekIndex.length).fill(true));
    useEffect(() => {
        console.log(visibleSchedules);
    }, [visibleSchedules]);
    let [constraints, setConstraints] = useState<Constraint[]>([...defaultConstraints]);

    // allow for simple activity search
    let [searchterm, setSearchterm] = useState<string>();
    let [inSettings, setInSettings] = useState(true); // fix this later: this is currently how you toggle to the settings page
    let [hideConstraints, setHideConstraints] = useState(inSettings);
    let [constraintHeight, setConstraintHeight] = useState(400);
    let [dragging, setDragging] = useState(false);

    const scheduler = new Scheduler();

    function getCurrentWeekIndex(): DayScheduleIndex[] {
        return Array.from({ length: 5 }, () =>
            new DayScheduleIndex(workspace.groups, workspace.times)
        )
    }

    // update week schedule when groups change
    useEffect(() => {
        setWeekIndex(getCurrentWeekIndex());
        const expandedGroups = workspace.groups.flatMap(group => group.isSplit ? [group.groupNum, group.groupNum + 0.5] : group.groupNum);
        const youngerGroups = new Set(expandedGroups.filter(gn => gn <= 4 || (gn > 10 && gn < 15)));
        const youngestGroups = new Set(expandedGroups.filter(gn => gn < 4 || (gn > 10 && gn < 13)));
        const multigroupConstraints = workspace.activities.filter(a => a.multigroup).map<Constraint>(a => {

            let ideaNumGroupsPerGrouping = 2;
            if (a.code === "CTF") {
                ideaNumGroupsPerGrouping = 4;
            } else if (a.code === "DGB") {
                ideaNumGroupsPerGrouping = 3;
            }

            let groupings: Set<number>[] = [];
            for (let i = 0; i < workspace.groups.length; ++i) {
                const indexToInsetAt = groupings.length === 0 ? 0
                    : groupings[groupings.length - 1].size > ideaNumGroupsPerGrouping - 1 ?
                        groupings.length :
                        groupings.length - 1;
                const group: Group = workspace.groups[i];
                if (indexToInsetAt < groupings.length) {
                    groupings[indexToInsetAt].add(group.groupNum);
                    if (group.isSplit) { groupings[indexToInsetAt].add(group.groupNum + 0.5); }
                } else {
                    const newGrouping = new Set<number>([group.groupNum]);
                    if (group.isSplit) { newGrouping.add(group.groupNum + 0.5); }
                    groupings.push(newGrouping);
                }
            }
            return { type: "multi", activity: a.code, groupings: groupings }
        });
        setConstraints([
            ...multigroupConstraints,
            { type: "group", activity: "BK1", allowed: true, groups: youngerGroups },
            { type: "group", activity: "BK2", allowed: false, groups: youngerGroups },
            { type: "group", activity: "GAGA1", allowed: true, groups: youngerGroups },
            { type: "group", activity: "GAGA2", allowed: false, groups: youngerGroups },
            { type: "group", activity: "WB1", allowed: true, groups: youngerGroups },
            { type: "group", activity: "WB2", allowed: false, groups: youngerGroups },
            { type: "group", activity: "T&C", allowed: true, groups: youngestGroups },
            ...defaultConstraints
        ]);
    }, [inSettings, workspace]);

    useEffect(() => {
        if (dragging) {
            const mouseMoveHandler = (e: MouseEvent) => {
                setConstraintHeight(e.clientY);
            };
            const mouseUpHandler = (_: MouseEvent) => {
                setDragging(false);
            };
            document.addEventListener("mousemove", mouseMoveHandler);
            document.addEventListener("mouseup", mouseUpHandler);
            return () => {
                document.removeEventListener(`mousemove`, mouseMoveHandler);
                document.removeEventListener("mouseup", mouseUpHandler);
            };
        }
    }, [dragging]);


    return (
        <WorkspaceContext.Provider value={workspace}>
            <div style={{
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Dummy element to force main view below toolbar THIS IS SOOO HACKY */}
                <div style={{
                    background: "green",
                    width: "100%",
                    height: "30px",
                    display: "flex"
                }}></div>

                {/* toolbar */}
                <div style={{
                    background: "#36454F",
                    borderBottom: "1px solid rgb(195, 195, 195)",
                    top: 0,
                    left: 0,
                    width: "100%",
                    padding: 10,
                    position: "fixed",
                    gap: "4px",
                    display: "flex"
                }}>
                    {/* Settings button */}
                    <button
                        onClick={async () => {
                            if (!inSettings) {
                                const proceed = await confirm("Switching to the settings page will delete all constraints and schedule data.");
                                if (!proceed) { return; }
                            }
                            setInSettings(prev => !prev);
                        }}
                    >
                        {inSettings ? "Workspace" : "Settings"}
                    </button>

                    {/* Hide/show constraints button */}
                    <button
                        disabled={inSettings}
                        onClick={() => {
                            setHideConstraints(prev => !prev);
                        }}
                    >
                        {hideConstraints ? "Show Constraints" : "Hide Constraints"}
                    </button>

                    <div
                        style={{
                            flex: "0.97"
                        }}
                    />

                    {/* Clear schedule button */}
                    <button
                        onClick={async () => {
                            const proceed = await confirm(
                                "All data for the week will be lost. Are you sure you want to proceed?",
                                { title: "Decathlon Schedule Builder" }
                            );
                            if (!proceed) { return; }
                            setWeekIndex(getCurrentWeekIndex());
                        }}
                        disabled={inSettings}
                    >
                        Clear
                    </button>

                    {/* Generate button */}
                    <button
                        onClick={async () => {
                            scheduler.init(weekIndex, workspace.activities, constraints);
                            const newSchedules = scheduler.run();
                            if (newSchedules === undefined || newSchedules?.length === 0) {
                                await confirm("Something is wrong with the constraints. Unable to generate schedule.");
                                return;
                            }
                            const newWeekIndex = weekIndex.map((dayIndex, i) => {
                                dayIndex.setSchedule(newSchedules[i]);
                                return dayIndex;
                            });
                            setWeekIndex([...newWeekIndex]); // force new reference
                        }}
                        disabled={inSettings}
                    >
                        Generate
                    </button>

                    {/* Export button */}
                    <button
                        onClick={() => { exportWeekToWorkbook(weekIndex) }}
                        disabled={inSettings}
                    >
                        Export
                    </button>

                    {/* Searchbar */}
                    <input
                        type="search"
                        id="query"
                        name="q"
                        placeholder="Search"
                        onChange={(e) => { setSearchterm(e.target.value) }}
                        disabled={inSettings}
                    />
                </div>


                <div hidden={!inSettings}>
                    <GroupSettings groups={workspace.groups} onChange={(updatedGroups) => setWorkspace(prev => { return { ...prev, groups: updatedGroups } })} />
                    <ActivitySettings activities={workspace.activities} onChange={(updatedActivities) => setWorkspace(prev => { return { ...prev, activities: updatedActivities } })} />
                </div>



                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            display: inSettings ? "none" : "flex",
                            width: "100%",
                            overflowX: "auto",
                        }}
                    >
                        {/* Day schedules */}
                        {weekIndex.map((dayIndex, i) => {
                            return (
                                <div key={weekdays[i]} style={{ padding: 10 }}>

                                    <h2 key={`hide-button-${i}`} onClick={() => { console.log("clicked"); setVisibleSchedules(prev => prev.map((v, idx) => idx === i ? !v : v)); }}>
                                        {
                                            visibleSchedules[i] ?
                                                weekdays[i] :
                                                weekdayAbbrs[i]
                                        }
                                    </h2>

                                    {
                                        visibleSchedules[i] &&
                                        <DayMasterSchedule
                                            key={`master-schedule-${i}`}
                                            dayScheduleIndex={dayIndex}
                                            setDayScheduleIndex={(newDayScheduleIndex) => {
                                                setWeekIndex((prev) => {
                                                    prev[i] = newDayScheduleIndex;
                                                    return [...prev];
                                                });
                                            }}
                                            searchterm={searchterm}
                                        />
                                    }

                                </div>
                            )
                        })}
                    </div>

                    <div
                        style={{
                            display: hideConstraints || inSettings ? "none" : "flex",
                            flexDirection: "column",
                            position: "absolute",
                            bottom: 5,
                            left: 0,
                            width: "100%",
                            top: constraintHeight,
                            background: "rgb(255, 255, 255)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                backgroundColor: "transparent",
                                width: "100%",
                                justifyContent: "center",
                                borderTop: "1px solid rgba(0,0,0,0.16)",
                                borderRadius: "10px"
                            }}
                            onMouseDown={() => setDragging(true)}
                        >
                            <div
                                style={{
                                    background: "rgba(0,0,0,0.16)",
                                    width: "100px",
                                    height: "7px",
                                    borderRadius: "999px"
                                }}
                            />
                        </div>



                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: 10
                            }}
                        >
                            <h2>Constraints</h2>
                            <button
                                onClick={() => {
                                    setConstraints([{ type: "empty" }, ...constraints]);
                                }}
                                style={{
                                    height: "fit-content",
                                    padding: "7px",
                                    margin: "10px",
                                }}
                            >
                                + Add Constraint
                            </button>
                        </div>

                        <div
                            style={{
                                overflowX: "scroll",
                                overflowY: "scroll",
                                borderRadius: 10,
                                height: "100%",
                            }}
                        >
                            <ConstraintList constraints={constraints} onChange={(updatedConstraints) => setConstraints(updatedConstraints)} />
                        </div>
                    </div>
                </div>



            </div>
        </WorkspaceContext.Provider>

    )
}
export default MultiDayWorkspace;