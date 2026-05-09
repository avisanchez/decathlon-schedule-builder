import { useEffect, useState } from "react";
import DayMasterSchedule from "./DayMasterSchedule";
import { Group, DayScheduleIndex } from "../types";
import Scheduler from "../algo/Scheduler";
import { exportWeekToWorkbook } from "../utils/export";
import ActivitySettings from "./ActivitySettings";
import GroupSettings from "./GroupSettings";
import ConstraintList, { Constraint } from "./ConstraintList";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { confirm } from "@tauri-apps/plugin-dialog";
import { defaultActivities, defaultConstraints, defaultGroups, defaultTimeSlots, weekdayAbbrs, weekdays } from "../constants";
import SplitLayout from "../SplitLayout";

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
    let [hideConstraints, setHideConstraints] = useState(false);

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
            { type: "group", activity: "BK1", allowed: true, groups: youngerGroups },
            { type: "group", activity: "BK2", allowed: false, groups: youngerGroups },
            { type: "group", activity: "GAGA1", allowed: true, groups: youngerGroups },
            { type: "group", activity: "GAGA2", allowed: false, groups: youngerGroups },
            { type: "group", activity: "WB1", allowed: true, groups: youngerGroups },
            { type: "group", activity: "WB2", allowed: false, groups: youngerGroups },
            { type: "group", activity: "T&C", allowed: true, groups: youngestGroups },
            ...multigroupConstraints,
            ...defaultConstraints
        ]);
        if (inSettings) {
            setHideConstraints(true);
        }
    }, [inSettings, workspace]);

    return (
        <WorkspaceContext.Provider value={workspace}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <SplitLayout
                    hidePanel={hideConstraints}
                    mainContent={
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100vh",
                                overflow: "hidden"
                            }}
                        >
                            {/* toolbar */}
                            <div style={{
                                background: "#36454F",
                                borderBottom: "1px solid rgb(195, 195, 195)",
                                width: "100%",
                                padding: 10,
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

                            {/* settings */}
                            <div
                                hidden={!inSettings}
                                style={{
                                    paddingLeft: 20,
                                    overflow: "auto"
                                }}
                            >
                                <GroupSettings groups={workspace.groups} onChange={(updatedGroups) => setWorkspace(prev => { return { ...prev, groups: updatedGroups } })} />
                                <ActivitySettings activities={workspace.activities} onChange={(updatedActivities) => setWorkspace(prev => { return { ...prev, activities: updatedActivities } })} />
                            </div>

                            {/* schedules */}
                            <div
                                style={{
                                    display: inSettings ? "none" : "flex",
                                    alignItems: "flex-start",
                                    width: "100%",
                                    overflowX: "auto",
                                }}
                            >
                                {/* Day schedules */}
                                {weekIndex.map((dayIndex, i) => {
                                    return (
                                        <div key={weekdays[i]}
                                            style={{
                                                padding: 10
                                            }}
                                        >

                                            <h2
                                                key={`hide-button-${i}`}
                                                onClick={() => {
                                                    console.log("clicked");
                                                    setVisibleSchedules(prev => prev.map((v, idx) => idx === i ? !v : v));
                                                }}
                                                style={{
                                                    marginTop: 10
                                                }}
                                            >
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
                        </div>
                    }
                    panelContent={
                        <div
                            style={{ height: "100%", display: "flex", flexDirection: "column" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexShrink: 0,
                                    paddingLeft: 10,
                                    boxShadow: "0px 0px 10px #8888881e"
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
                                    flexGrow: 1,
                                    borderRadius: 10
                                }}
                            >
                                <ConstraintList constraints={constraints} onChange={(updatedConstraints) => setConstraints(updatedConstraints)} />
                            </div>
                        </div>
                    }
                />
            </div>
        </WorkspaceContext.Provider>

    )
}
export default MultiDayWorkspace;