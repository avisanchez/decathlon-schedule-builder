import { BrowserRouter, Routes, Route } from "react-router";
import GroupForm from "./group/GroupForm"
import GroupCard from "./group/GroupCard"
import GroupSettings from "./group/GroupSettings"
import { Gender, Group } from "./group/types"
import ActivityList from "./activity/ActivityList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/GroupCard" element={<GroupCard group={{ groupNum: 5, isSplit: false, gender: Gender.MALE }} />} />
        <Route path="/GroupForm" element={<GroupForm onSubmit={(numGroups: number) => { console.log(numGroups) }} />} />
        <Route path="/GroupSettings" element={<GroupSettings />} />
        <Route path="/ActivityList" element={<ActivityList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
