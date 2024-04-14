const { Schedule: SchduleModel } = require("../models");
const mongoose = require("mongoose");
const ScheduleJob = require("node-schedule");
const { minNext, getCurrentWeekDayIndex } = require("../utils");
const { getAllSchedulefornotification } = require("./scheduleService");
const PushNotificationService = require("../common/push-notification");

class ScheduleService {
  // schdules = [];

  filterSchedules = (schedules) => {
    let newSchedules = [];
    newSchedules = schedules.map((sch) => {
      let datetime = new Date(sch.datetime);
      let nowDate = new Date();
      if (sch.repeat === "1") {
        if (datetime > nowDate) {
          return {...sch, datetime: datetime};
        } else {
          return null;
        }
      } else if (sch.repeat === "2") {
        const hours = datetime.getHours();
        const min = datetime.getMinutes();
        nowDate.setHours(hours, min);
        return {...sch, datetime: nowDate};
      } else if (sch.repeat === "3") {
        const date = new Date();
        nowDate.setHours(datetime.getHours(), datetime.getMinutes());
        let currentDayIndex =
          nowDate > date ? nowDate.getDay() + 1 : nowDate.getDay();
        let dayinarray;
        let days = sch.days.map((d) => {
          const day = getCurrentWeekDayIndex(d);
          if (day === currentDayIndex) {
            dayinarray = currentDayIndex;
          }
          return day;
        });
        if (!dayinarray) {
          dayinarray = minNext(days, currentDayIndex);
          if (dayinarray === Infinity) {
            dayinarray = 6 + Math.min(...days) - nowDate.getDay();
          }
        }
        // nowDate.setDate(datetime.getDate() + dayinarray);
        return {...sch, datetime: nowDate};
      } else {
        return sch;
      }
    });
    return newSchedules.filter((sch) => sch != null || sch != undefined);
  };

  createSechduleNotification = (sch = null) => {
    if (sch === null) return;
    else if(!sch.fcmToken) return;
    console.log();
    const rule = new ScheduleJob.RecurrenceRule();
    const date = new Date(sch.datetime);
    const nowDate = new Date();
    console.log("sch._id",sch._id," title =>",sch.title);
    rule.hour = date.getHours();
    rule.minute = date.getMinutes();
    rule.year = date.getFullYear();
    rule.month = date.getMonth();
    rule.second = [5];
    let desc

    if (sch.repeat === "2") {
      rule.date = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
      ];
      sch.type==="play"?desc="Playtime!":sch.type==="meal"?desc="Time to eat!":sch.type==="medication"?desc="Time for the meds!":desc="Vaccination Alert!"
    } else if (sch.repeat === "3") {
      rule.dayOfWeek = sch.days.map((d) => getCurrentWeekDayIndex(d));
      sch.type==="play"?desc="Time for that weekly playtime!":sch.type==="meal"?desc="Time for that weekly meal!":sch.type==="medication"?desc="Time for the weekly meds!":desc="Vaccination Alert!"
    } else {
      rule.date = date.getDate();
      desc=sch.description
    }
    if(rule.nextInvocationDate()){
     console.log("rule => ",rule.nextInvocationDate());

    
      ScheduleJob.scheduleJob(
        `${sch._id}-${sch.pet}-sch`,
        rule,
        async function () {
          await PushNotificationService.notifySingleDevice(
            {
            title:  `${sch.type} for ${sch.petName} ${sch.title}`,
            body: desc,
          },
          sch.fcmToken,
          {
            _id: sch._id.toString(),
            screenName: "Schedule",
            screenId: sch._id.toString(),
          }
        );
      }
    );
  }
  };
  getSchdulesList = () => {
    return ScheduleJob.scheduledJobs;
  };

  cencelSchdule = (id) => {
    if (!id) return;
    return ScheduleJob.cancelJob(id)
    // return ScheduleJob.scheduledJobs[id].cancel();
  };

  getSingleSchedule=(id)=>{
    return ScheduleJob.scheduledJobs[id]
  }
  createSchduleListUsingCollection = async () => {
    //   for removing all Schedules
    console.log("deleteing old Schedule (if any)");
    for (const job in ScheduleJob.scheduledJobs) ScheduleJob.cancelJob(job);

    const match = {
      // only for testing
    };
    console.log("geting Schedule from DB");
    const schedules = await getAllSchedulefornotification(match);

    console.log("filtering Schedule ![null,undefined]");
    let newSchedules = this.filterSchedules(schedules);

    console.log("Creating Schedule");
    newSchedules.forEach((sch) => {
      this.createSechduleNotification(sch);
    });
  };
}
module.exports = new ScheduleService();
