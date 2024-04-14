const BlogService = require("../service/blog");
const CategoryService = require("../service/category");
const {Blog}= require("../models")
const mongoose = require("mongoose");

exports.GetAllBlogs = async (req, res, next) => {
  try {
    const { user } = req;
    const perPage = Number(req.query.perPage || 10);
    const pageNo = Number(req.query.pageNo || 1);
    const query = RegExp(req.query.search || "", "i");
    const [blogs, category,blogsCount] = await Promise.all([
      BlogService.getBlogsForUser(
        {
          $expr: {
            $or: [{ title: query }],
          },
          active: true,
        },
        user._id,
        pageNo,
        perPage
      ),
      CategoryService.getCategoryForUser({}),
      BlogService.blogsCountaggregate({
        $expr: {
          $or: [{ title: query }],
        },
        active: true,
      })
    ]);

    return res.status(200).json({
      success: true,
      data: { blogs, allCategory: category,blogsCount:blogsCount[0].count },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.GetAllBlogsForWebsite = async (req, res, next) => {
  try {
    const { user } = req;
    const query = RegExp(req.query.search || "", "i");
    const [blogs, category,blogsCount] = await Promise.all([
      BlogService.getBlogsForWeb(
        {
          $expr: {
            $or: [{ title: query }],
          },
          active: true,
        },
        user._id
      ),
      CategoryService.getCategoryForUser({}),
      BlogService.blogsCountaggregate({
        $expr: {
          $or: [{ title: query }],
        },
        active: true,
      })
    ]);

    return res.status(200).json({
      success: true,
      data: { blogs, allCategory: category,blogsCount:blogsCount[0].count },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.SearchBlogsByTitle = async (req, res, next) => {
  try {
    // convert below code to aggregate
    const { user } = req;
    const perPage = Number(req.query.perPage || 10);
    const pageNo = Number(req.query.pageNo || 1);
    const query = RegExp(req.query
      .search || "", "i");
    const blogs = await BlogService.getBlogsForUser(
      {
        title:query,
        active: true,
      },
      user._id,
      pageNo,
      perPage
    )

    return res.status(200).json({
      success: true,
      data: { blogs },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
exports.getSingleBlogForUser = async (req, res, next) => {
  try {
    const blogId=mongoose.Types.ObjectId(req.params.id);
    const blogs = await BlogService.GetBlogForUser(
      { _id:  blogId},
      req.user._id
    );
    if (!blogs.length) return next({ status: 404, msg: "blog not found" });
    if(!blogs[0].isViewed) await Blog.updateOne({_id:blogId},{$push:{viewsCount:req.user._id}})
    return res.status(200).json({
      success: true,
      data: { blog: blogs[0] },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

// exports.helpfulBlog = async (req, res, next) => {
//   try {
//     const blog = await BlogService.GetBlogById(req.params.id);
//     if (!blog) return next({ status: 404, msg: "blog not found" });
//     const newBlog = { ...blog._doc };
//     const isLike = blog.helpful.find(
//       (h) => h.toString() === req.user._id.toString()
//     );
//     if (isLike) {
//       newBlog.liked = false;
//       newBlog.unliked = false;
//       blog.helpful.pop(req.user._id);
//     } else {
//       newBlog.liked = true;
//       newBlog.unliked = false;
//       blog.helpful.push(req.user._id);
//       const isunLike = blog.unhelpful.find(
//         (h) => h.toString() === req.user._id.toString()
//       );
//       isunLike && blog.unhelpful.pop(req.user._id);
//     }
//     await blog.save();
//     newBlog.helpful = blog.helpful.length;
//     newBlog.unhelpful = blog.unhelpful.length;
//     newBlog.viewsCount = blog.viewsCount.length;
//     // realtime for user and admin
//     // const socketAdmin = req.app.io.nsps["/admin"];
//     // const socketUser = req.app.io.nsps["/user"];
//     // socketAdmin.emit(`blogs`, blog);s
//     return res
//       .status(200)
//       .json({ success: true, data: { blog: newBlog }, msg: "ok", status: 200 });
//   } catch (error) {
//     return next(error);
//   }
// };

// exports.unHelpfulBlog = async (req, res, next) => {
//   try {
//     const blog = await BlogService.GetBlogById(req.params.id);
//     if (!blog) return next({ status: 404, msg: "blog not found" });
//     const newBlog = { ...blog._doc };
//     const isunLike = blog.unhelpful.find(
//       (h) => h.toString() === req.user._id.toString()
//     );

//     if (isunLike) {
//       blog.unhelpful.pop(req.user._id);
//       newBlog.liked = false;
//       newBlog.unliked = false;
//     } else {
//       blog.unhelpful.push(req.user._id);
//       const isunLike = blog.helpful.find(
//         (h) => h.toString() === req.user._id.toString()
//       );
//       isunLike && blog.helpful.pop(req.user._id);

//       newBlog.unliked = true;
//       newBlog.liked = false;
//     }
//     newBlog.viewsCount = blog.viewsCount.length;
//     newBlog.helpful = blog.helpful.length;
//     newBlog.unhelpful = blog.unhelpful.length;
//     await blog.save();
//     // realtime for user and admin
//     // const socketAdmin = req.app.io.nsps["/admin"];
//     // const socketUser = req.app.io.nsps["/user"];
//     // socketAdmin.emit(`blogs`, blog);
//     // socketUser.emit(`${blog._id}-blogs`, blog);
//     return res
//       .status(200)
//       .json({ success: true, data: { blog: newBlog }, msg: "ok", status: 200 });
//   } catch (error) {
//     return next(error);
//   }
// };

exports.helpfulBlog = async (req, res, next) => {
  try {
    const blog = await BlogService.GetBlogById(req.params.id);
    if (!blog) return next({ status: 404, msg: "blog not found" });
    const newBlog = { ...blog._doc };
    const isLike = blog.helpful.find(
      (h) => h.toString() === req.user._id.toString()
    );
    const isunLike = blog.unhelpful.find(
      (h) => h.toString() === req.user._id.toString()
    );
    console.log("req.user._id.toString() => ",req.user._id.toString())
    console.log("isLike => ",isLike)
    console.log("isunLike => ",isunLike)
    if (isLike&&isunLike) {
      newBlog.liked = false;
      newBlog.unliked = false;
      blog.helpful.pop(req.user._id);
      blog.unhelpful.pop(req.user._id);
    } else if (isLike) {
      newBlog.liked = false;
      newBlog.unliked = false;
      blog.helpful.pop(req.user._id);
    } else {
      if(isunLike){
        blog.unhelpful.pop(req.user._id)
      }
      blog.helpful.push(req.user._id);
      newBlog.liked = true;
      newBlog.unliked = false;
    }
    await blog.save();
    newBlog.helpful = blog.helpful.length;
    newBlog.unhelpful = blog.unhelpful.length;
    newBlog.viewsCount = blog.viewsCount.length;
    return res
      .status(200)
      .json({ success: true, data: { blog: newBlog }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.unHelpfulBlog = async (req, res, next) => {
  try {
    const blog = await BlogService.GetBlogById(req.params.id);
    if (!blog) return next({ status: 404, msg: "blog not found" });
    // console.log("blog => ",blog)
    const newBlog = { ...blog._doc };
    const isLike = blog.helpful.find(
      (h) => h.toString() === req.user._id.toString()
    );
    const isunLike = blog.unhelpful.find(
      (h) => h.toString() === req.user._id.toString()
    );
    console.log("req.user._id.toString() => ",req.user._id.toString())
    console.log("isLike => ",isLike)
    console.log("isunLike => ",isunLike)
    if (isLike&&isunLike) {
      newBlog.liked = false;
      newBlog.unliked = false;
      blog.helpful.pop(req.user._id);
      blog.unhelpful.pop(req.user._id);
    } else if (isunLike) {
      newBlog.liked = false;
      newBlog.unliked = false;
      blog.unhelpful.pop(req.user._id);
    } else {
      if(isLike){
        blog.helpful.pop(req.user._id)
      }
      blog.unhelpful.push(req.user._id);
      newBlog.liked = false;
      newBlog.unliked = true;
    }
    await blog.save();
    newBlog.viewsCount = blog.viewsCount.length;
    newBlog.helpful = blog.helpful.length;
    newBlog.unhelpful = blog.unhelpful.length;
    return res
      .status(200)
      .json({ success: true, data: { blog: newBlog }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getBlogByCategory = async (req, res, next) => {
  try {
    const perPage = Number(req.query.perPage || 10);
    const pageNo = Number(req.query.pageNo || 1);

    let blogs;
    const { user } = req;
    blogs=await BlogService.getBlogsForUser({category: mongoose.Types.ObjectId(req.params.id)},user._id,pageNo,perPage)
    return res.status(200).json({
      success: true,
      data: { blogs },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
