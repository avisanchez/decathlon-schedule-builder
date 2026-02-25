import GroupForm from "./GroupForm"
import { useState } from "react"
import { Gender, Group } from "./types"
import GroupCard from "./GroupCard"

function GroupSettings() {

    let [groups, setGroups] = useState<Group[]>([])

    function onSubmit(numGroups: number) {
        let difference = numGroups - groups.length

        if (difference == 0) {
            return
        }

        // explain to user that their changes will persist
        let message = `This change will ${difference < 0 ? "permanently delete" : "create"} ${Math.abs(difference)} group${Math.abs(difference) > 1 ? "s" : ""}.`
        let proceed = confirm(message)

        if (proceed) {
            let newGroups: Group[] = []
            for (let i = 0; i < groups.length + difference; ++i) {
                if (i >= groups.length) {
                    newGroups.push({ groupNum: i + 1, isSplit: false, gender: Gender.MALE })
                } else {
                    newGroups.push(groups[i]);
                }
            }
            setGroups(newGroups);
        }
    }

    return (
        <div>
            <h1>Group Settings</h1>
            <GroupForm onSubmit={onSubmit} />
            {
                groups.map(group => {
                    return (
                        <GroupCard group={group} />
                    )
                })
            }
        </div>
    )
}

export default GroupSettings;