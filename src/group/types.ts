
export enum Gender {
    MALE,
    FEMALE
}

export interface Group {
    groupNum: number
    isSplit: boolean // whether the group is split in two
    gender: Gender
}