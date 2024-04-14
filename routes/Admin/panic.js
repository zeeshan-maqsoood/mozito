const router = require("express").Router()

const {
    getPanicsForAdmin,
    getSinglePanicForAdmin,
    deleteSinglePanicForAdmin
} = require("../../controller/panic")

router.get("/all",getPanicsForAdmin)
router.get("/:id",getSinglePanicForAdmin)
router.delete("/:id",deleteSinglePanicForAdmin)

module.exports=router