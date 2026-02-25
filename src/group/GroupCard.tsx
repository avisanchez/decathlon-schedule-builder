
import { useState } from "react";
import { Gender, Group } from "./types"

function GroupCard({ group }: { group: Group }) {
    let [split, setSplit] = useState(false);

    return (
        <div>
            <div>
                Group {group.groupNum}
                {split && `Group ${group.groupNum}.5`}
                ({group.gender == Gender.MALE ? "B" : "G"})
            </div>
            <input type="checkbox" checked={split} onChange={(e) => { setSplit(e.target.checked) }} />
        </div>
    )
}

export default GroupCard;