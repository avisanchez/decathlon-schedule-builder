import ExcelJS from 'exceljs';
import { DayScheduleIndex } from '../types';
import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';


export async function exportWeekToWorkbook(weekIndex: DayScheduleIndex[]): Promise<void> {
    const DEFAULT_PATH: string = "workspace.xlsx";

    try {
        // create workbook
        const workbook = new ExcelJS.Workbook();

        // set metadata
        workbook.creator = "Avi Sanchez";
        workbook.lastModifiedBy = "decathlon_schedule_builder.app";
        workbook.created = new Date();
        workbook.modified = new Date();

        /**
         * Current assuptions:
         * - Groups stay consistent across a given week
         * - Assuming the title is week 1
         */
        const groupNames = weekIndex[0].getGroupNames();
        groupNames.forEach((groupName, groupIndex) => {
            const sheet = workbook.addWorksheet(groupName);

            sheet.getRow(1).values = [groupName];
            sheet.getRow(2).values = ["Week 1"];
            sheet.getRow(3).values = ["", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

            for (let timeSlotIndex = 0; timeSlotIndex < weekIndex[0].getTimeSlots().length; ++timeSlotIndex) {
                let rowValues: string[] = [weekIndex[0].getTimeSlots()[timeSlotIndex]];

                for (let dayIndex = 0; dayIndex < weekIndex.length; ++dayIndex) {
                    rowValues.push(weekIndex[dayIndex].getSchedule()[groupIndex][timeSlotIndex] ?? "<NULL>");
                }

                sheet.getRow(4 + timeSlotIndex).values = rowValues;
            }
        });

        const path = await save({ defaultPath: DEFAULT_PATH });

        if (path === null) {
            console.warn("Save path was found to be null. Aborting export.")
            return;
        }

        const tempBuffer = await workbook.xlsx.writeBuffer();
        const buffer = new Uint8Array(tempBuffer);
        await writeFile(path, buffer);
    } catch (error) {
        alert(`Exporting schedule failed.\n\n${error}`);
        return console.error("Failed to export schedule with error: ", error);
    }
}