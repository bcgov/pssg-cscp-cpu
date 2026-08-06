import { iHours } from "../hours.interface";
import { iDynamicsSchedule } from "../dynamics-blob";
import { encodeToWeekDayCodes } from "../../constants/encode-to-week-days";
import moment from 'moment';

export function convertHoursToDynamics(hours: iHours, programId: string, standByHours = false): iDynamicsSchedule {
  return {
    vsd_scheduledendtime: convertToDynamicsTimeString(hours.closed, hours.isAMClosed),
    vsd_scheduledstarttime: convertToDynamicsTimeString(hours.open, hours.isAMOpen),
    vsd_days: encodeToWeekDayCodes(hours),
    vsd_scheduleid: hours.hoursId,
    vsd_ProgramIdfortunecookiebind: programId,
    vsd_cpu_scheduletype: standByHours ? 100000001 : 100000000,
    statecode: hours.isActive ? 0 : 1,
  };
}
function convertToDynamicsTimeString(time: string, isAM: boolean): string {
  return (time + (isAM ? 'am' : 'pm'));
  // let ret = time;
  // if (isAM) {
  //   ret += "am";
  // }
  // else {
  //   ret += "pm";
  // }

  // console.log(ret)

  // return ret;
}
export function makeViewTimeString(dynamicsTime: string): string {
  // input is AM/PM clock. e.g. 11:11pm
  // output is 24 hour e.g. 23:11
  if (dynamicsTime && dynamicsTime.length > 5) {
    let hour = parseInt(dynamicsTime.substring(0, 2));
    // if (dynamicsTime.includes('p')) hour += 12;
    const minute = parseInt(dynamicsTime.substring(3, 5));
    return moment()
      .hour(hour)
      .minute(minute)
      .format('HH:mm');
  }
  else {
    return dynamicsTime
  }
}
