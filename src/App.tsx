import { BrowserRouter, Routes, Route } from "react-router";
import GroupForm from "./group/GroupForm"
import GroupCard from "./group/GroupCard"
import GroupSettings from "./group/GroupSettings"
import { Gender, Group } from "./group/types"
import ActivityList from "./activity/ActivityList";
import DayMasterSchedule from "./schedule/DayMasterSchedule";
import { DaySchedule } from "./algo/types";
import { useState } from "react";
import { exportDayScheduleToWorkbook } from "./utils/export";

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

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/GroupCard" element={<GroupCard group={{ groupNum: 5, isSplit: false, gender: Gender.MALE }} />} />
          <Route path="/GroupForm" element={<GroupForm onSubmit={(numGroups: number) => { console.log(numGroups) }} />} />
          <Route path="/GroupSettings" element={<GroupSettings />} />
          <Route path="/ActivityList" element={<ActivityList />} />
          <Route path="/DayMasterSchedule" element={<DayMasterSchedule title={"Friday"} daySchedule={daySchedule} />} />
        </Routes>
      </BrowserRouter>
      <button onClick={() => {
        exportDayScheduleToWorkbook();
      }}>
        Export
      </button>
    </>
  );
}

export default App;
