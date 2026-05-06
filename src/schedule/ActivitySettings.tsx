import { useRef, useState } from "react";
import { Activity } from "../activity/types";


function ActivitySettings({ activities, onChange, onSave }: {
    activities: Activity[],
    onChange?: (updatedActivities: Activity[]) => void,
    onSave?: (updatedActivities: Activity[]) => void
}) {
    return (
        <div>
            <h2>Activities</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, max-content)", gap: "10px" }}>
                {activities.map((activity, i) => {
                    return (
                        <ActivityCard activity={activity} onSave={(updatedActivity) => {
                            const updatedActivities = activities.map<Activity>((activity, j) => {
                                return i === j ? updatedActivity : activity;
                            });
                            if (onChange) { onChange(updatedActivities); }
                        }} />
                    )
                })}
            </div>
        </div >
    )
}

function ActivityCard({ activity, focused, onSave }: { activity: Activity, focused?: boolean, onSave?: (activity: Activity) => void }) {
    let [name, setName] = useState("");
    let [code, setCode] = useState(activity.code);

    let [focusState, setFocusState] = useState(focused ?? false);

    function isCodeValid(): boolean {
        return code !== "";
    }

    let typeRef = useRef<HTMLSelectElement | null>(null);

    if (focusState === true) {
        return (
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.2)", padding: "10px", width: "fit-content", borderRadius: "5px" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "fit-content",
                        marginBottom: "5px"
                    }}
                >
                    <label>Code</label>
                    <input
                        placeholder={"Enter code"}
                        value={code}
                        onChange={(e) => { setCode(e.target.value) }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "fit-content",
                        marginBottom: "5px"
                    }}>
                    <label>Name</label>
                    <input
                        placeholder={"Enter name"}
                        value={name}
                        onChange={(e) => { setName(e.target.value) }}
                    />
                </div>
                <div style={{ display: "flex", flexDirection: "column", width: "fit-content", marginBottom: "10px" }}>
                    <label>Type</label>
                    <select ref={typeRef}>
                        <option>Regular</option>
                        <option>Special</option>
                    </select>
                </div>
                <button style={{ width: "100%" }} disabled={!isCodeValid()} onClick={() => {
                    onSave && onSave({ ...activity, name: name, code: code, multigroup: typeRef.current?.value === "Multi-Group", special: typeRef.current?.value === "Special" });
                    setFocusState(false);
                }}>Save</button>
            </div>
        )
    } else {
        return (
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.2)", padding: "10px", width: "inherit", borderRadius: "5px" }} onClick={() => { setFocusState(true) }}>
                <div>
                    {activity.code}
                </div>
                {activity.name &&
                    <div style={{ opacity: "0.4", fontSize: "small" }}>
                        {activity.name}
                    </div>
                }

                <div style={{ display: "flex" }}>
                    {activity.special &&
                        <div style={{
                            backgroundColor: "gold",
                            textAlign: "center",
                            fontSize: "small",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            borderRadius: "2px",
                            padding: "2px",
                            marginTop: "3px",
                            width: "100%"
                        }} />
                    }
                    {activity.multigroup &&
                        <div style={{
                            backgroundColor: "#6596F3",
                            textAlign: "center",
                            fontSize: "small",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            borderRadius: "2px",
                            padding: "2px",
                            marginTop: "3px",
                            width: "100%"
                        }} />
                    }
                    {!activity.multigroup && !activity.special &&
                        <div style={{
                            backgroundColor: "#83B366",
                            textAlign: "center",
                            fontSize: "small",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            borderRadius: "2px",
                            padding: "2px",
                            marginTop: "3px",
                            width: "100%"
                        }} />
                    }
                </div>
            </div>
        )
    }
}

export default ActivitySettings;