import { useContext, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { UserContext } from "../App";

const NotificationCommentField = ({
  _id,
  blogAuthor,
  index = undefined,
  replyingTo = undefined,
  setReplying,
  notificationId,
  notificationData,
}) => {
  const [comment, setComment] = useState("");

  const { _id: userId } = blogAuthor;
  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);

  const {
    notifications,
    notifications: { results },
    setNotifications,
  } = notificationData;

  const handleComment = async () => {
    if (!comment.length) {
      return toast.error("Please enter something to leave a comment");
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`,
        {
          _id,
          blogAuthor: userId,
          comment,
          replyingTo,
          notificationId,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      setComment("");
      setReplying(false);

      results[index].reply = { comment, _id: data._id };

      setNotifications({ ...notifications, results });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        placeholder="Leave a reply..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
        onChange={(e) => setComment(e.target.value)}
      ></textarea>
      <button className="btn-dark mt-5 px-10" onClick={handleComment}>
        Reply
      </button>
    </>
  );
};

export default NotificationCommentField;
