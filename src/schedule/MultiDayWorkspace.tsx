import { useEffect, useState } from "react";
import DayMasterSchedule from "./DayMasterSchedule";
import { Constraint, DaySchedule, MultiGroupActivityConstraint, SingleInstanceConstraint } from "../algo/types";
import { Group } from "../group/types";
import Scheduler from "../algo/Scheduler";
import { exportDayScheduleToWorkbook } from "../utils/export";
import { Activity } from "../activity/types";
import ActivitySettings from "./ActivitySettings";
import GroupSettings from "./GroupSettings";
import ConstraintList from "./ConstraintList";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { confirm } from "@tauri-apps/plugin-dialog";

function MultiDayWorkspace() {

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
    const defaultActivities: Activity[] = [
        "A&C",
        "BG",
        "BK1",
        "BK2",
        "BKT",
        "BT",
        "CTF",
        "DGB",
        "FR",
        "FB",
        "GAGA1",
        "GAGA2",
        "HK",
        "LA*",
        "MULTI",
        "OR*",
        "PB",
        "PG",
        "PP",
        "ROCH*",
        "SOC",
        "ST*",
        "T&C",
        "TH",
        "TTHOF*",
        "TUG*",
        "VB",
        "WALL",
        "WB1",
        "WB2",
        "SNACK*",
        "LUNCH*",
        "REST/POPS*"
    ].map<Activity>(code => { return { code: code.trim().substring(0, code.endsWith("*") ? code.length - 1 : undefined), special: code.endsWith("*") } });

    let [workspace, setWorkspace] = useState({ groups: defaultGroups, activities: defaultActivities, times: defaultTimeSlots });
    let [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(
        Array.from({ length: 5 }, () =>
            new DaySchedule(workspace.groups, workspace.times)
        )
    )

    let [constraints, setConstraints] = useState<Constraint[]>([]);

    let scheduler = new Scheduler();

    // allow for collapsable day schedules
    let [visibleSchedules, setVisibleSchedules] = useState<boolean[]>(new Array(weekSchedule.length).fill(true));
    useEffect(() => {
        console.log(visibleSchedules);
    }, [visibleSchedules]);

    function getEmptyWeekSchedule(): DaySchedule[] {
        return Array.from({ length: 5 }, () =>
            new DaySchedule(workspace.groups, workspace.times)
        )
    }

    // update week schedule when groups change
    useEffect(() => {
        setWeekSchedule(getEmptyWeekSchedule());
    }, [workspace.groups]);

    // allow for simple activity
    let [searchterm, setSearchterm] = useState<string>();

    let [inSettings, setInSettings] = useState(false);

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
                    background: "gray",
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
                        onClick={() => {
                            setInSettings(prev => !prev);
                        }}
                    >
                        Settings
                    </button>

                    {/* Clear schedule button */}
                    <button
                        onClick={async () => {
                            const proceed = await confirm(
                                "All data for the week will be lost. Are you sure you want to proceed?",
                                { title: "Decathlon Schedule Builder" }
                            );
                            if (!proceed) { return; }
                            setWeekSchedule(getEmptyWeekSchedule());
                        }}
                        disabled={inSettings}
                    >
                        Clear Schedule
                    </button>

                    {/* Generate button */}
                    <button
                        onClick={() => {
                            scheduler.init(weekSchedule, defaultActivities, [...constraints, new SingleInstanceConstraint(), new MultiGroupActivityConstraint(new Map)]);
                            const newSchedules = scheduler.run();
                            const updatedDaySchedules = weekSchedule.map((daySchedule, i) => {
                                daySchedule.setSchedule(newSchedules[i]);
                                return daySchedule;
                            });
                            setWeekSchedule([...updatedDaySchedules]); // force new reference
                        }}
                        disabled={inSettings}
                    >
                        Generate
                    </button>

                    {/* Export button */}
                    <button
                        onClick={() => { exportDayScheduleToWorkbook(weekSchedule) }}
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

                {inSettings ?
                    <div>
                        <GroupSettings groups={workspace.groups} onChange={(updatedGroups) => setWorkspace(prev => { return { ...prev, groups: updatedGroups } })} />
                        <ActivitySettings activities={workspace.activities} onChange={(updatedActivities) => setWorkspace(prev => { return { ...prev, activities: updatedActivities } })} />
                    </div>
                    :
                    <div>
                        {/* Day schedules */}
                        <div style={{ display: "flex" }}>
                            {weekSchedule.map((daySchedule, i) => {
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
                                            <DayMasterSchedule key={`master-schedule-${i}`} daySchedule={daySchedule} setDaySchedule={(newDaySchedule) => {
                                                setWeekSchedule((prev) => {
                                                    prev[i] = newDaySchedule;
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

                        <div>
                            <h2>Constraints</h2>
                            <ConstraintList />
                        </div>
                    </div>
                }
            </div>
        </WorkspaceContext.Provider>

    )
}
export default MultiDayWorkspace;