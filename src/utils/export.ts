import ExcelJS from 'exceljs';
import { DaySchedule } from '../algo/types';
import { writeFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, downloadDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';


export async function exportDayScheduleToWorkbook(weekSchedule: DaySchedule[]): Promise<void> {
    // create workbook
    const workbook = new ExcelJS.Workbook();

    // set metadata
    workbook.creator = "Avi Sanchez";
    workbook.lastModifiedBy = "decathlon_schedule_builder.app";
    workbook.created = new Date();
    workbook.modified = new Date();

    // const schedule = daySchedule.getSchedule();
    // const groups = daySchedule.getGroups();

    /**
     * Current assuptions:
     * - Groups stay consistent across a given week
     * - Assuming the title is week 1
     */
    weekSchedule[0].getGroupNames().forEach((groupName, groupIndex) => {
        const sheet = workbook.addWorksheet(groupName);

        sheet.getRow(1).values = [groupName];
        sheet.getRow(2).values = ["Week 1"];
        sheet.getRow(3).values = ["", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

        // let rowIndex = 0;
        // let colIndex = 0;

        for (let timeSlotIndex = 0; timeSlotIndex < weekSchedule[0].getTimeSlots().length; ++timeSlotIndex) {
            let rowValues: string[] = [weekSchedule[0].getTimeSlots()[timeSlotIndex].time];

            for (let dayIndex = 0; dayIndex < weekSchedule.length; ++dayIndex) {
                rowValues.push(weekSchedule[dayIndex].getSchedule()[groupIndex][timeSlotIndex] ?? "<NULL>");
            }

            sheet.getRow(4 + timeSlotIndex).values = rowValues;
        }
    });

    const path = await save({ defaultPath: 'output.xlsx' });

    const buffer = new Uint8Array(await workbook.xlsx.writeBuffer());
    await writeFile(path!, buffer);
}