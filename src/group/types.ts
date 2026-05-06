
export enum Gender {
    MALE,
    FEMALE
}

export interface Group {
    groupNum: number // expected to be a whole number. To specify a group x.5, set isSplit=true
    isSplit: boolean // whether the group is split in two
    gender?: Gender
}