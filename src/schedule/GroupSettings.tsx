import { useState } from "react";
import { Group } from "../group/types";

function GroupSettings({ groups, onChange, onSave }: {
    groups: Group[],
    onChange?: (updatedGroups: Group[]) => void,
    onSave?: (updatedGroups: Group[]) => void,
}) {

    let [numGroups, setNumGroups] = useState(`${groups.length}`);

    return (
        <div>
            <h2>Groups</h2>
            <input placeholder="Enter group count" type="number" min={1} max={20} style={{ width: "150px", marginBottom: "10px" }} value={numGroups} onChange={(e) => { setNumGroups(e.target.value) }} />
            <button onClick={() => {
                let numGroupsAsInt = Number(numGroups);

                if (Number.isInteger(numGroupsAsInt) && 0 < numGroupsAsInt && numGroupsAsInt <= 20) {
                    if (numGroupsAsInt === groups.length) {
                        return;
                    } else if (numGroupsAsInt < groups.length) {
                        const updatedGroups = groups.filter((_, i) => i < numGroupsAsInt);
                        if (onChange) { onChange(updatedGroups); }
                    } else {
                        const updatedGroups = Array.from({ length: numGroupsAsInt }, (_, i) =>
                            i < groups.length ? groups[i] : { groupNum: i + 1, isSplit: false }
                        );
                        if (onChange) { onChange(updatedGroups); }
                    }
                } else {
                    alert("Please enter a whole number greater than one and less than or equal to 20.");
                    setNumGroups(`${groups.length}`);
                }
            }}>Apply</button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, max-content)", gap: "10px" }}>
                {
                    groups.map((group, i) => {
                        return (
                            <GroupCard group={group} onChange={(updatedGroup) => {
                                const updatedGroups = groups.map((group, j) => {
                                    return i === j ? updatedGroup : group;
                                })
                                if (onChange) { onChange(updatedGroups); }
                            }} />
                        )
                    })
                }
            </div>
        </div>
    )
}

function GroupCard({ group, focused, onChange }: { group: Group, focused?: boolean, onChange?: (updatedGroup: Group) => void }) {

    function handleClick(): void {
        if (onChange) { onChange({ ...group, isSplit: !group.isSplit }); }
    }

    return (
        <div
            onClick={handleClick}
            style={{
                border: "1px solid rgba(0, 0, 0, 0.2)",
                borderRadius: "5px",
                padding: "5px"
            }}
        >
            <div>
                Group {group.groupNum}{group.isSplit && `/${group.groupNum + 0.5}`}
            </div>
        </div>
    )
}

export default GroupSettings;