const { Blog } = require("../models");
const mongoose = require("mongoose");
class BlogService {
  constructor() {}
  static getBlogsForUser = (match, userId, pageNo = 0, perPage = 10) => {
    console.log("match=>",match)
    const id = mongoose.Types.ObjectId(userId);
    return Blog.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          createdBy: {
            _id: 1,
            username: 1,
          },
          category: {
            _id: 1,
            name: 1,
          },
          photo: 1,
          title: 1,
          body: 1,
          active: 1,
          liked: {
            $in: [id, "$helpful"],
          },
          isViewed: {
            $in: [id, "$viewsCount"],
          },
          unliked: {
            $in: [id, "$unhelpful"],
          },
          viewsCount: {
            $size: "$viewsCount",
          },
          helpful: {
            $size: "$helpful",
          },
          unhelpful: {
            $size: "$unhelpful",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip:
          // pageNo === 0 || pageNo === 1 || pageNo <= 1 ? 0 : pageNo * perPage,
          (pageNo<=1?0:(pageNo*perPage)-perPage)
      },
      {
        $limit: perPage || 10,
      },
    ]);
  };
  static getBlogsForWeb = (match, userId) => {
    // console.log("match=>",match)
    const id = mongoose.Types.ObjectId(userId);
    return Blog.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          createdBy: {
            _id: 1,
            username: 1,
          },
          category: {
            _id: 1,
            name: 1,
          },
          photo: 1,
          title: 1,
          body: 1,
          active: 1,
          liked: {
            $in: [id, "$helpful"],
          },
          isViewed: {
            $in: [id, "$viewsCount"],
          },
          unliked: {
            $in: [id, "$unhelpful"],
          },
          viewsCount: {
            $size: "$viewsCount",
          },
          helpful: {
            $size: "$helpful",
          },
          unhelpful: {
            $size: "$unhelpful",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      }
    ]);
  };
  static blogsCountaggregate = (match) => {
    return Blog.aggregate([
      {
        $match: match,
      },
      {
        $count:"count"
      }
    ]);
  };
  static GetBlogForUser = (match, userId) => {
    const id = mongoose.Types.ObjectId(userId);
    return Blog.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          createdBy: {
            _id: 1,
            username: 1,
          },
          category: {
            _id: 1,
            name: 1,
          },
          photo: 1,
          title: 1,
          body: 1,
          active: 1,
          isViewed: {
            $in: [id, "$viewsCount"],
          },
          liked: {
            $in: [id, "$helpful"],
          },
          unliked: {
            $in: [id, "$unhelpful"],
          },
          viewsCount: {
            $size: "$viewsCount",
          },
          helpful: {
            $size: "$helpful",
          },
          unhelpful: {
            $size: "$unhelpful",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
  };
  static GetBlogById = (id) => {
    return Blog.findById(id)
      .populate("createdBy", "username")
      .populate("category", "name")
      .select("-comments -deleted -__v");
  };
  static blogsCount(query={}){
    return Blog.countDocuments(query);
  }
}
module.exports = BlogService;
