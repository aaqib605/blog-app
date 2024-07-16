import { useContext, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { UserContext } from "../App";
import { BlogContext } from "../pages/blog.page";
import axios from "axios";

const CommentField = ({
  action,
  index = undefined,
  replyingTo = undefined,
  setIsReplying,
}) => {
  const [comment, setComment] = useState("");

  const {
    userAuth: { jwtToken, username, fullname, profileImg },
  } = useContext(UserContext);

  const {
    blog,
    blog: {
      _id,
      author: { _id: blogAuthor },
      comments,
      comments: { results: commentsArr },
      activity,
      activity: { totalComments, totalParentComments },
    },
    setBlog,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  const handleComment = async () => {
    if (!jwtToken) {
      return toast.error("Please login to leave a comment");
    }

    if (!comment.length) {
      return toast.error("Please enter something to leave a comment");
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`,
        {
          _id,
          blogAuthor,
          comment,
          replyingTo,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      setComment("");

      data.commentedBy = {
        personalInfo: { username, profileImg, fullname },
      };

      let newCommentArr;

      if (replyingTo) {
        commentsArr[index].children.push(data._id);

        data.childrenLevel = commentsArr[index].childrenLevel + 1;
        data.parentIndex = index;

        commentsArr[index].isReplyLoaded = true;

        commentsArr.splice(index + 1, 0, data);

        newCommentArr = commentsArr;

        setIsReplying(false);
      } else {
        data.childrenLevel = 0;

        newCommentArr = [data, ...commentsArr];
      }

      const parentCommentIncrementVal = replyingTo ? 0 : 1;

      setBlog({
        ...blog,
        comments: { ...comments, results: newCommentArr },
        activity: {
          ...activity,
          totalComments: totalComments + 1,
          totalParentComments: totalParentComments + parentCommentIncrementVal,
        },
      });

      setTotalParentCommentsLoaded(
        (prevValue) => prevValue + parentCommentIncrementVal
      );
    } catch (error) {
      console.log(error);
      toast.error("Error adding comment, try again");
    }
  };

  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        placeholder="Leave a comment..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
        onChange={(e) => setComment(e.target.value)}
      ></textarea>
      <button className="btn-dark mt-5 px-10" onClick={handleComment}>
        {action}
      </button>
    </>
  );
};

export default CommentField;
