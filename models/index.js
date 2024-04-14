
const Admin = require("./adminModel");
const Blog = require("./blog");
const User = require("./userModel");
const State = require("./statemodel");
const City = require("./cityModel");
const Species = require("./speciesModel");
const Breed = require("./breedModel");
const Category = require("./categoryModel");
const Color = require("./colorModel");
const AccountRecovery = require("./AccountRRecoveryRequest");
const Pet = require("./petModel");
const Report = require("./reportModel");
const Reason = require("./reportReasonModel");
const Feedback = require("./feedbackModel");
const Faq = require("./faqs");
const Role = require("./roleModel");
const PetFound = require("./PetFound");
const LostPet = require("./LostPet");
const LostPetOther = require("./lostPetforother");
const EmergencyAlert = require("./emergencyAlert");
const Meal = require("./MealModel");
const Play = require("./playModel");
const Medication = require("./Medication");
const Country = require("./countryModel");
const Chat = require("./chatmodel");
const Message = require("./message");
const Pairing = require("./pairingModel");
const Notification = require("./notificationModel");
const Interest = require("./interestModel");
const Post = require("./postModel");
const Version = require("./versionApkModal");
const Media= require("./media")
const Panic=require("./panic")
const Comments=require("./commentsModel")
const Schedule=require("./Schedule")
const Friends= require("./friends")
const Panic_Reason=require("./PanicReason");
const SpeciesType=require("./speciesType");
const UserDelete=require("./user_delete");
const UserLogin=require("./userlogins")
const PostReport=require("./post_report_model")
const PanicReport=require("./panic_report_model")
const PetReport=require("./pet_report_model")
const GuestUser=require("./guestusermodel")
const GuestUserLogin=require("./guestuserlogins")
const UserPageModel=require("./userPageModel")
const StatusModel=require("./statusModel")
const UserPagePost=require("./userPagePost")

module.exports = {
    UserDelete,
    Media,
    Admin,
    Blog,
    Schedule,
    User,
    State,
    City,
    Species,
    SpeciesType,
    Breed,
    Category,
    Color,
    AccountRecovery,
    Pet,
    Report,
    Reason,
    Feedback,
    Faq,
    Role,
    LostPet,
    LostPetOther,
    PetFound,
    EmergencyAlert,
    Meal,
    Play,
    Medication,
    Country,
    Chat,
    Message,
    Pairing,
    Notification,
    Interest,
    Post,
    Version,
    Panic,
    Comments,
    Friends,
    Panic_Reason,
    UserLogin,
    PostReport,
    PanicReport,
    GuestUser,
    GuestUserLogin,
    PetReport,
    UserPageModel,
    StatusModel,
    UserPagePost
}