const router = require("express").Router();
const {
  requireSigninUser,
  requireSigninUserOptional,
} = require("../../middlewares/userAuth");
const { idValidator } = require("../../middlewares");
const {
  GetAllBlogs,
  getSingleBlogForUser,
  helpfulBlog,
  unHelpfulBlog,
  getBlogByCategory,
  SearchBlogsByTitle,
  GetAllBlogsForWebsite
} = require("../../controller/blog");
router.param("id", idValidator);
// ok-hyf
// paginated
// test
// 1. get blog using authorization (token)
// 2. get blog using without token
// 3. get all blog using query params pageNo and perPage items
router.get("/all", requireSigninUserOptional, GetAllBlogs);

router.get("/allblogsforweb", requireSigninUserOptional, GetAllBlogsForWebsite);

router.get("/searchBlogByTitle" ,requireSigninUserOptional,SearchBlogsByTitle)

// ok-hyf
// id= blogId
// test
// 1. get blog using authorization (token)
// 2. get blog using without token
router.get("/:id", requireSigninUserOptional, getSingleBlogForUser);

// ok-hyf
// test
// 1. like blog using token 
// 2. like blog using no token
router.put("/helpful/:id", requireSigninUser, helpfulBlog);

// ok-hyf
// id= blogId
// test
// 1. unlike blog using token 
// 2. unlike blog using no token
router.put("/unhelpful/:id", requireSigninUser, unHelpfulBlog);

// ok-hyf
// paginated
// test
// 1. get blog using authorization (token)
// 2. get blog using without token
// 3. get blog using query params pageNo and perPage items
router.get("/bycategory/:id", requireSigninUserOptional, getBlogByCategory);

module.exports = router;
