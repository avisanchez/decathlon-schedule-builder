
export enum Gender {
    MALE,
    FEMALE
}

export interface Group {
    groupNum: number // must be an interger
    isSplit: boolean // whether the group is split in two
    gender: Gender
}