import { Activity } from "../activity/types"

export type DaySchedule = (Activity | null)[][]
export type WeekSchedule = DaySchedule[]
export type Coordinate = { row: number, col: number }