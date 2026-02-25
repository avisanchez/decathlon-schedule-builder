// Handle the creation of project groups

import { useState } from "react";

/**
 * Input to select the desired number of groups.
 * 
 * @note Only inputs in the range [1,20] are valid. On submit will never be invoked with an invalid number of groups.
 * 
 * @param onSubmit - An optional callback which is passed the number of groups input by the user.
 */
function GroupForm({ onSubmit }: { onSubmit?: (numGroups: number) => void }) {
    let [numGroups, setNumGroups] = useState(1)

    let MIN_NUM_GROUPS = 1
    let MAX_NUM_GROUPS = 20

    let validInput: boolean = (MIN_NUM_GROUPS <= numGroups && numGroups <= MAX_NUM_GROUPS)

    // Match expected function signature and double-check valid input
    function onSubmitWrapper() {
        if (!validInput) {
            console.assert(validInput)
            return
        }
        console.log(`Updated the number of groups to ${numGroups}`)
        onSubmit && onSubmit(numGroups)
    }

    return (
        <div>
            <input
                placeholder="Number of groups"
                type="number"
                min={MIN_NUM_GROUPS}
                max={MAX_NUM_GROUPS}
                value={numGroups}
                onChange={(e) => setNumGroups(parseInt(e.target.value))}
            />
            <button
                disabled={!validInput}
                onClick={onSubmitWrapper}>
                Confirm
            </button>
        </div>
    );
}

export default GroupForm;