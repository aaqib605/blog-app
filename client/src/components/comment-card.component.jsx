import { useContext, useState } from "react";
import { getDay } from "../common/date";
import { UserContext } from "../App";
import toast from "react-hot-toast";
import CommentField from "./comment-field.component";
import { BlogContext } from "../pages/blog.page";
import axios from "axios";

const CommentCard = ({ index, leftVal, commentData }) => {
  const [isReplying, setIsReplying] = useState(false);

  const {
    commentedBy: {
      personalInfo: { profileImg, fullname, username: commentedByUsername },
    },
    commentedAt,
    comment,
    _id,
    children,
  } = commentData;

  const {
    userAuth: { jwtToken, username },
  } = useContext(UserContext);

  const {
    blog,
    blog: {
      comments,
      activity,
      activity: { totalParentComments },
      comments: { results: commentsArr },
      author: {
        personalInfo: { username: blogAuthor },
      },
    },
    setBlog,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  const handleReply = () => {
    if (!jwtToken) {
      return toast.error("Please login to reply to a comment");
    }

    setIsReplying((prevValue) => !prevValue);
  };

  const getParentIndex = () => {
    let startingPoint = index - 1;

    try {
      while (
        commentsArr[startingPoint].childrenLevel >= commentData.childrenLevel
      ) {
        startingPoint--;
      }
    } catch {
      startingPoint = undefined;
    }

    return startingPoint;
  };

  const removeCommentsCard = (startingPoint, isDelete = false) => {
    if (commentsArr[startingPoint]) {
      while (
        commentsArr[startingPoint].childrenLevel > commentData.childrenLevel
      ) {
        commentsArr.splice(startingPoint, 1);

        if (!commentsArr[startingPoint]) {
          break;
        }
      }
    }

    if (isDelete) {
      const parentIndex = getParentIndex();

      if (parentIndex !== undefined) {
        commentsArr[parentIndex].children = commentsArr[
          parentIndex
        ].children.filter((child) => child !== _id);

        if (!commentsArr[parentIndex].children.length) {
          commentsArr[parentIndex].isReplyLoaded = false;
        }
      }

      commentsArr.splice(index, 1);
    }

    if (commentData.childrenLevel === 0 && isDelete) {
      setTotalParentCommentsLoaded((prevValue) => prevValue - 1);
    }

    setBlog({
      ...blog,
      comments: { results: commentsArr },
      activity: {
        ...activity,
        totalParentComments:
          totalParentComments - commentData.childrenLevel === 0 && isDelete
            ? 1
            : 0,
      },
    });
  };

  const handleHideReplies = () => {
    commentData.isReplyLoaded = false;

    removeCommentsCard(index + 1);

    setBlog({ ...blog, comments: { results: commentsArr } });
  };

  const loadReplies = async ({ skip = 0, currentIndex = index }) => {
    if (commentsArr[currentIndex].children.length) {
      handleHideReplies();

      try {
        const {
          data: { replies },
        } = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/get-replies`,
          { _id: commentsArr[currentIndex], skip }
        );

        commentsArr[currentIndex].isReplyLoaded = true;

        for (let i = 0; i < replies.length; i++) {
          replies[i].childrenLevel =
            commentsArr[currentIndex].childrenLevel + 1;

          commentsArr.splice(currentIndex + 1 + i + skip, 0, replies[i]);
        }

        setBlog({ ...blog, comments: { ...comments, results: commentsArr } });
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleDeleteComment = async (e) => {
    e.target.setAttribute("disabled", true);

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`,
        { _id },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      e.target.removeAttribute("disabled");

      removeCommentsCard(index + 1, true);
    } catch (error) {
      console.log(error.message);
    }
  };

  const LoadMoreRepliesButton = () => {
    const parentIndex = getParentIndex();

    const button = (
      <button
        className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
        onClick={() =>
          loadReplies({
            skip: index - parentIndex,
            currentIndex: parentIndex,
          })
        }
      >
        Load More Replies
      </button>
    );

    if (commentsArr[index + 1]) {
      if (
        commentsArr[index + 1].childrenLevel < commentsArr[index].childrenLevel
      ) {
        if (index - parentIndex < commentsArr[parentIndex].children.length) {
          return button;
        }
      }
    } else {
      if (parentIndex) {
        if (index - parentIndex < commentsArr[parentIndex].children.length) {
          return button;
        }
      }
    }
  };

  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rounded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          <img
            src={profileImg}
            alt="User profile"
            className="w-6 h-6 rounded-full"
          />
          <p className="line-clamp-1">
            {fullname} @{commentedByUsername}
          </p>
          <p className="min-w-fit">{getDay(commentedAt)}</p>
        </div>

        <p className="font-gelasio text-xl ml-3">{comment}</p>

        <div className="flex gap-5 items-center mt-5">
          {commentData.isReplyLoaded ? (
            <button
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              onClick={handleHideReplies}
            >
              <i className="fi- fi-rs-comment-dots"></i>
              Hide Reply
            </button>
          ) : (
            <button
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              onClick={loadReplies}
            >
              <i className="fi- fi-rs-comment-dots"></i>
              {children.length} Reply
            </button>
          )}

          <button className="underline" onClick={handleReply}>
            Reply
          </button>

          {username === commentedByUsername || username === blogAuthor ? (
            <button
              className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
              onClick={handleDeleteComment}
            >
              <i className="fi fi-rr-trash pointer-events-none"></i>
            </button>
          ) : (
            ""
          )}
        </div>

        {isReplying ? (
          <div className="mt-8">
            <CommentField
              action="reply"
              index={index}
              replyingTo={_id}
              setIsReplying={setIsReplying}
            />
          </div>
        ) : (
          ""
        )}
      </div>

      <LoadMoreRepliesButton />
    </div>
  );
};

export default CommentCard;
