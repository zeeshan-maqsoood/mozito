const rateLimit = require("express-rate-limit");
const { uniq } = require("lodash");
exports.differenceWithIds = (arr1 = [], arr2 = []) => {
  const newArr1 = arr1.map((v) => v.toString());
  const newArr2 = arr2.map((v) => v.toString());
  return newArr1.filter((x) => !newArr2.includes(x));
  /* 
        e.g
       [1,2,3].filter(x => ![1,2].includes(x));
         [3]
    */
};
exports.commonwithIds = (arr1 = [], arr2 = []) => {
  const newArr1 = arr1.map((v) => v.toString());
  const newArr2 = arr2.map((v) => v.toString());
  return newArr1.filter((x) => newArr2.includes(x));
  /* 
        e.g
       [1,2,3].filter(x => [1,2].includes(x));
         [1,2]
    */
};
exports.uniqbyIds = (arr) => {
  const newArr = arr.map((v) => v.toString());
  return uniq(newArr);
};
exports.apiLimiter = (time = 10000, count = 5) =>
  rateLimit({
    windowMs: time,
    max: count,
    handler: (res, req, next) => {
      return next({ status: 429, msg: "Limit Reached" });
    },
  });

exports.getAgeString = (dob1) => {
  //collect input from HTML form and convert into date format
  var userinput = dob1;
  var dob = new Date(userinput);
  //execute if the user entered a date
  //extract the year, month, and date from user date input
  var dobYear = dob.getYear();
  var dobMonth = dob.getMonth();
  var dobDate = dob.getDate();

  //get the current date from the system
  var now = new Date();
  //extract the year, month, and date from current date
  var currentYear = now.getYear();
  var currentMonth = now.getMonth();
  var currentDate = now.getDate();

  //declare a variable to collect the age in year, month, and days
  var age = {};
  var ageString = "";

  //get years
  yearAge = currentYear - dobYear;

  //get months
  if (currentMonth >= dobMonth)
    //get months when current month is greater
    var monthAge = currentMonth - dobMonth;
  else {
    yearAge--;
    var monthAge = 12 + currentMonth - dobMonth;
  }

  //get days
  if (currentDate >= dobDate)
    //get days when the current date is greater
    var dateAge = currentDate - dobDate;
  else {
    monthAge--;
    var dateAge = 31 + currentDate - dobDate;

    if (monthAge < 0) {
      monthAge = 11;
      yearAge--;
    }
  }
  age = {
    years: yearAge,
    months: monthAge,
    days: dateAge,
  };
  return `${age.years ? age.years + " years" : ""} ${
    age.months ? age.months + " months" : ""
  } ${age.days ? age.days + " days" : ""}`.trim();
};

exports.getCurrentWeekDayIndex = (day) => {
  switch (day) {
    case "sun":
      return 0;
    case "mon":
      return 1;
    case "tue":
      return 2;
    case "wed":
      return 3;
    case "thu":
      return 4;
    case "fri":
      return 5;
    case "sat":
      return 6;

    default:
      break;
  }
};

exports.getAgeStringAsYear = (dob1) => {
  var dob = new Date(dob1);
  var newDate = new Date();
  const ageinYears = (
    Math.abs((newDate - dob) /
    (1000 * 60 * 60 * 24 * 30 * 12))
  ).toFixed(2);
  return `${ageinYears}`.trim();
};
exports.minNext = (a, el, id) => {
  var min = Infinity;
  for (let x of a) {
    if (x > el && x - el < min - el) min = x;
  }
  return min;
};
