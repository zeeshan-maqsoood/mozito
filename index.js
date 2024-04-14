const Express = require('express');
const { instrument } = require('@socket.io/admin-ui');
const app = Express();
const dotenv = require('dotenv');
const cors = require('cors');
const bodyparser = require('body-parser');
const log4js = require('log4js');
const morgan = require('morgan');
const path = require('path');
const server = require('http').createServer(app);
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
var compression = require('compression');
var { upload } = require('./s3');
upload = upload('test');
const { Server } = require('socket.io');
const MailService = require('./service/mail');
// const RedisClient = require("./redis");
const io = new Server(server, {
  cors: {
    origin: '*',
    // credentials: false,
  },
});
module.exports = io;
app.use(Express.static(path.join(__dirname, './uploads')));
const Adminnsp = io.of('/admin');
const Usernsp = io.of('/user');
// app.io = io;
dotenv.config();
const connectDB = require('./db');
connectDB();
const ScheduleService = require('./service/scheduleNotification');
const DeviceDetector = require('node-device-detector');
const deviceDetector = new DeviceDetector();
app.use((req, res, next) => {
  const useragent = req.headers['user-agent'];
  req.useragent = useragent;
  req.device = deviceDetector.detect(useragent);
  next();
});
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
// (middleware) start for checking how many request and which route is most used
const listOfReq = {};
let totalRequest = 0;
app.use((req, res, next) => {
  let url = listOfReq[req.url];
  const newreq = { ...url };
  if (req.url.toString() !== '/api/listOfReq') {
    ++totalRequest;
    if (url) {
      newreq.total = url.total + 1;
    } else {
      newreq.total = 1;
      newreq.method = req.method;
    }
    listOfReq[req.url] = newreq;
  }
  next();
});

//  end (middleware)
app.get('/api/listOfReq', (req, res, next) => {
  return res.json({ totalRequest, listOfReq });
});

// const someController = (value) => {
//     console.log(value);
//     return (req, res, next) => {
//         return next();
//     }
// }
// app.put("/api/updateuser", someController(""), async (req, res, next) => {
//     try {
//         return res.send("pet updated")
//     } catch (error) {
//         return next();
//     }
// })

const UserRoutes = require('./routes/Users');
const AdminRoutes = require('./routes/Admin');
const GuestUserRoutes = require('./routes/GuestUsers');
const { getAllSchedulefornotification } = require('./service/scheduleService');

app.use('/api/user', UserRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/guestuser', GuestUserRoutes);
app.use(['/api/*', '/api'], (req, res, next) => {
  console.error('Invalid Routes');
  console.error(req.url);
  return next({ status: 404, msg: 'invalid routes' });
});

// for rendring angular ("admin.mazito.com") directly used while while project is deployed to heroku

// app.get("*", (req, res) => {
//     return res.sendFile(path.join(__dirname, "build", "index.html"))
//})
app.use((err, req, res, next) => {
  console.error(err);
  console.error(req.url);
  return res.status(err.status || 500).json({
    success: err.success || false,
    data: {},
    ...err,
    msg: err.msg || 'Something Went wronge',
  });
});
const PORT = process.env.PORT || 3500;





server.listen(PORT, async () => {
  console.log(`server in running on PORT ${PORT}`);
  await ScheduleService.createSchduleListUsingCollection();
  console.log(
    `${Object.keys(ScheduleService.getSchdulesList()).length} Schedule Created`
  );
  MailService.verify();
});
//  <<-- Start Scoket.io for future use -->>

// const cl = () => {
//     console.log("---");
//     // console.log("user", Object.keys(io.of("/user").sockets))
//     // console.log("user/client-=>", Object.keys(io.of("/user").clients().sockets))
//     console.log("---");
//     const users = Object.keys(io.of("/user").sockets).length
//     io.emit("onlineAppUser", { users });
//     return users;
// }

// io.use((socket, next) => {
//     const token = socket.handshake.query.token ? socket.handshake.query.token.split(" ")[1] : "";
//     if (!token) {
//         console.log("InvalidToken")
//         return
//     }
//     jwt.verify(token, process.env.JWT_SECRET_ADMIN, async (err, decode) => {
//         if (!decode) {
//             console.log("InvalidToken")
//             return
//         }
//         else {
//             const user = await Admin.findById(decode._id)
//                 .select({
//                     password: false,
//                     __v: false
//                 })
//             if (!user) {
//                 console.log("unauthorized")
//                 return
//             }
//             socket.user = user
//             return next();
//         }
//     });
// })

// io.on("connection", (socket) => {
//   console.log(socket.id, " Connected");

//   socket.on("disconnect", () => {
//     console.log(socket.id, " Disconnected");
//   });
// });
// instrument(io, {
//   auth: false,
//   readonly: true,
// });
// const admins = [];
// Adminnsp.use((socket, next) => {
//     const token = socket.handshake.query.token ? socket.handshake.query.token.split(" ")[1] : "";
//     if (!token) {
//         console.log("InvalidToken")
//         return
//     }
//     jwt.verify(token, process.env.JWT_SECRET_ADMIN, async (err, decode) => {
//         if (!decode) {
//             console.log("InvalidToken")
//             return
//         }
//         else {
//             const user = await Admin.findByIdAndUpdate(decode._id, { online: true }, { new: true })
//                 .select({
//                     password: false,
//                     __v: false
//                 });
//             if (!user) {
//                 console.log("unauthorized")
//                 return
//             }
//             socket.user = user
//             return next();
//         }
//     });
// });
// Adminnsp.on("connection", (socket) => {
//     socket.emit("hi", { msg: "hi" });

// })
// Usernsp.use((socket, next) => {
//     const token = socket.handshake.query.token ? socket.handshake.query.token.split(" ")[1] : "";
//     if (!token) {
//         console.log("InvalidToken")
//         return
//     }
//     jwt.verify(token, process.env.JWT_SECRET_USER, async (err, decode) => {
//         if (!decode) {
//             console.log("InvalidToken")
//             return
//         }
//         else {
//             const user = await User.findByIdAndUpdate(decode._id, { online: true }, { new: true })
//                 .select({
//                     password: false,
//                     __v: false
//                 });
//             if (!user) {
//                 console.log("unauthorized")
//                 return
//             }
//             socket.user = user
//             return next();
//         }
//     });
// })
// const appUsers = []
// Usernsp.on('connection', socket => {
//     // console.log(socket.user)
//     console.log(cl())
//     Usernsp.emit("hi", { msg: "hi" })
//     socket.on("newuser", (data) => {
//         const user = appUsers.find(user => user.socketId === socket.id);
//         if (!user) {
//             appUsers.push({ socketId: socket.id });
//         }
//         Usernsp.emit("newuser", { users: appUsers });
//     });

//     socket.on("typing", ({ to, from }) => {
//         console.log("typing", { from, to })
//         Usernsp.emit("typing")
//         Usernsp.emit(`${from}-${to}-typing`)
//     });
//     // create / message api
//     // socket.on("newmsg", ({ to, from, msg }) => {
//     //     console.log("newmsg", { from, to });
//     //     Usernsp.emit(`${from}-${to}-newmsg`, { from, to, msg })
//     // });

//     socket.on("newMessage", (message) => {
//         console.log("newMessage=<", message);
//         Usernsp.to(message.to).emit("newMessage", { ...message });
//     });

//     socket.on("disconnect", async () => {
//         appUsers.filter(user => user.socketId !== socket.id);
//         Usernsp.emit("newuser", { users: appUsers });
//         console.log(cl())
//         await User.findByIdAndUpdate(socket.user._id, { online: false }, { new: true })
//     })
// });

//  <<-- End Scoket.io for future use -->>
