const { Schema, model } = require('mongoose');
const userPagePostSchema = new Schema(
  {
    description: {
      type: String,
      default: '',
    },
    mediaList: [
      {
        isVideo: {
          type: Boolean,
          default: false,
        },
        thumbnail_image: {
          type: String,
          default: '',
        },
        url: {
          type: String,
          default: '',
        },
      },
    ],
    likes: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    parentComment: [
      {
        body: {
          type: String,
        },
        pageId: {
          type: Schema.Types.ObjectId,
          ref: 'userPage',
        },
        comments: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: 'User',
            },
            date: {
              type: Date,
              default: Date.now(),
            },
            message: {
              type: String,
            },
          },
        ],
      },
    ],

    userPagePosts: {
      type: Schema.Types.ObjectId,
      ref: 'Userpages',
    },
  },
  {
    timestamps: true,
  }
);
userPagePostSchema.plugin(require('mongoose-delete'), {
  overrideMethods: 'all',
  deletedAt: true,
});
module.exports = model('UserPagePost', userPagePostSchema);
