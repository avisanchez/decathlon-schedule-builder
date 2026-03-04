import { Activity } from "../activity/types"

export type DaySchedule = (Activity | null)[][]
export type WeekSchedule = DaySchedule[]