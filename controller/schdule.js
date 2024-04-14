const router = require("express").Router();
const mongoose = require("mongoose");
const { Schedule,Pet } = require("../models");
const _ = require("lodash");
const { minNext, getCurrentWeekDayIndex } = require("../utils");
const ScheduleJob=require("../service/scheduleNotification");
exports.createSchedule = async (req, res, next) => {
  try {
    let days = [];
    const body = req.body;
    if (body.repeat === "3") {
      days = body.days;
    }
    const schdule = new Schedule({
      ...req.body,
      days,
      datetime: new Date(body.datetime),
    });
    schdule.owner = req.user._id;
    schdule.pet = req.selected_pet._id;
    await schdule.save();
    await Schedule.populate(schdule,{ path: "owner", select: "fcmToken" })
    // let pet = await Pet.findById({_id:req.selected_pet._id})
    // if (!pet) return next({ status: 404, msg: "Pet Not Found" });
    // let petname = pet.name
    // console.log("petname => ",req.selected_pet.name)
    
    ScheduleJob.createSechduleNotification({...schdule._doc,fcmToken:schdule.owner.fcmToken,petName:req.selected_pet.name});
    schdule.owner=undefined;
    return res
      .status(200)
      .json({ success: true, data: { schdule,owner:undefined }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getSchduleHistory = async (req, res, next) => {
  try {
    console.log("req.user._id => ",req.user._id)
    console.log("req.selected_pet._id => ",req.selected_pet._id)
    // console.log("Date.now() => ",new Date())
    let match = {
      pet: req.selected_pet._id,
      datetime: { $lt: new Date().toISOString() },
      // datetime: { $lt: Date.now() },
      repeat: 1
    };
    if (req.query.type) {
      match.type = req.query.type;
    }
    const schedules = await Schedule.find(match);
    return res
      .status(200)
      .json({ success: true, data: { schedules }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getUpcommingSchdule = async (req, res, next) => {
  try {
    
    let match = {
      pet: mongoose.Types.ObjectId(req.selected_pet._id),
      // datetime:{$lt:Date.now()}
    };
    if (req.query.type) {
      match.type = req.query.type;
    }
    // const schedules = await Schedule.find(match);
    const schedules = await Schedule.aggregate([
      {
        $match: match,
      },
    ]);
    let newSchedules = [];
    newSchedules = schedules.map((sch) => {
      // return {...sch,sortTime:new Date()}
      let datetime = new Date(sch.datetime);
      let nowDate = new Date();
      if (sch.repeat === "1") {
        if (datetime > nowDate) {
          // sch.sortTime = datetime;
          return { ...sch, datetime: datetime };
        } else {
          return null;
        }
      } else if (sch.repeat === "2") {

        const hours = datetime.getHours();
        const min = datetime.getMinutes();
        nowDate.setHours(hours, min);
        // sch.sortTime = nowDate;
        return { ...sch, datetime: nowDate };
        // return sch;
      } else if (sch.repeat === "3") {
        // const day=datetime.getDay();
        const date = new Date();
        nowDate.setHours(datetime.getHours(), datetime.getMinutes());
        let currentDayIndex =nowDate > date ? nowDate.getDay() + 1 : nowDate.getDay();
        // let currentDayIndex = nowDate.getDay();
        let dayinarray;
        let days = sch.days.map((d) => {
          const day = getCurrentWeekDayIndex(d);
          if (day === currentDayIndex) {
            dayinarray = currentDayIndex;
          }
          return day;
        });
        if(!dayinarray){
          dayinarray=minNext(days,currentDayIndex);
          if(dayinarray === Infinity){
            dayinarray=6 + Math.min(...days)-nowDate.getDay();
          }
        }

        nowDate.setDate(datetime.getDate()+dayinarray)
        return { ...sch, datetime: nowDate };
      } else {
        return sch;
      }
    });
    newSchedules = newSchedules.filter((sch) => sch !== null);
    return res.status(200).json({
      success: true,
      data: {
        schedules: newSchedules.sort(function (a, b) {
          return new Date(b.datetime) - new Date(a.datetime);
        }).reverse(),
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getSchduleById = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({
      pet: req.selected_pet._id,
      _id: req.params.id,
    }).populate("pet", "name photo");
    if (!schedule) return next({ status: 404, msg: "Schedule not found" });
    return res
      .status(200)
      .json({ success: true, data: { schedule }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.updateSchduleById = async (req, res, next) => {
  try {
    const { body } = req;
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, pet: req.selected_pet._id },
      { ...body },
      { new: true }
    );
    if (!schedule) return next({ status: 404, msg: "schedule not found" });

    const jobId=`${schedule._id}-${schedule.pet}-sch`;

    ScheduleJob.cencelSchdule(jobId);
    await Schedule.populate(schedule,{ path: "owner", select: "fcmToken" })
    
    ScheduleJob.createSechduleNotification({...schedule._doc,fcmToken:schedule.owner.fcmToken,petName:req.selected_pet.name});
    schedule.owner=undefined;
    return res
      .status(200)
      .json({ success: true, data: { schedule }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.deleteSchduleById = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({
      pet: req.selected_pet._id,
      _id: req.params.id,
    });
    if (!schedule) return next({ status: "404", msg: "schedule not found" });
    await schedule.remove();
    const jobId=`${schedule._id}-${schedule.pet}-sch`;
    ScheduleJob.cencelSchdule(jobId);

    return res.status(200).json({
      success: true,
      data: { msg: "schedule deleted" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
