import { createContext } from "react";
import { Group } from "../group/types";
import { Activity } from "../activity/types";

export interface WorkspaceConfig {
    readonly groups: Group[],
    readonly activities: Activity[],
    readonly times: string[]
}

export const WorkspaceContext = createContext<WorkspaceConfig>({
    groups: Array<Group>(),
    activities: Array<Activity>(),
    times: Array<string>()
});