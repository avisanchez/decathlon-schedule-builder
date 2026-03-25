import { BrowserRouter, Routes, Route } from "react-router";
import GroupForm from "./group/GroupForm"
import GroupCard from "./group/GroupCard"
import GroupSettings from "./group/GroupSettings"
import { Gender, Group } from "./group/types"
import ActivityList from "./activity/ActivityList";
import DayMasterSchedule from "./schedule/DayMasterSchedule";
import { DaySchedule, ExcludeGroupsConstraint, MultiGroupActivityConstraint, SingleInstanceConstraint, SpecialActivityConstraint } from "./algo/types";
import { useState } from "react";
import { exportDayScheduleToWorkbook } from "./utils/export";
import getActivities from "./activity/utils";
import Scheduler from "./algo/Scheduler";

function App() {
    let groups: Group[] = [];
    for (let i = 1; i <= 16; ++i) {
        groups.push({ groupNum: i, isSplit: new Set([-1]).has(i), gender: Gender.MALE });
    }

    let [daySchedule, setDaySchedule] = useState<DaySchedule>(new DaySchedule(groups, [
        { time: "9:30" },
        { time: "10:15", mandatoryActivity: { code: "SNACK" } },
        { time: "10:30" },
        { time: "11:15" },
        { time: "12:00", mandatoryActivity: { code: "LUNCH" } },
        { time: "1:10" },
        { time: "1:50" },
        { time: "2:30", mandatoryActivity: { code: "REST/POPS" } },
        { time: "2:45" }
    ]));

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

    return (
        <>
            {/* <BrowserRouter>
        <Routes>
          <Route path="/GroupCard" element={<GroupCard group={{ groupNum: 5, isSplit: false, gender: Gender.MALE }} />} />
          <Route path="/GroupForm" element={<GroupForm onSubmit={(numGroups: number) => { console.log(numGroups) }} />} />
          <Route path="/GroupSettings" element={<GroupSettings />} />
          <Route path="/ActivityList" element={<ActivityList />} />
          <Route path="/DayMasterSchedule" element={<DayMasterSchedule title={"Friday"} daySchedule={daySchedule} />} />
        </Routes>
      </BrowserRouter> */}
            <DayMasterSchedule daySchedule={daySchedule} />
            <DayMasterSchedule daySchedule={daySchedule} readOnly={true} />
            <DayMasterSchedule daySchedule={daySchedule} />
            <button onClick={() => {
                exportDayScheduleToWorkbook();
            }}>
                Export
            </button>
        </>
    );

    // <button onClick={() => {
    //     let newSchedule = s.genDaySchedule();
    //     setSchedule(newSchedule);
    //     exportDayScheduleToWorkbook(daySchedule);
    // }
    // }>Generate Schedule</button>
}

export default App;
