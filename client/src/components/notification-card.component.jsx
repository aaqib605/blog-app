import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import NotificationCommentField from "./notification-comment-field.component";
import { UserContext } from "../App";
import axios from "axios";

const NotificationCard = ({ data, index, notificationState }) => {
  const [isReplying, setIsReplying] = useState(false);

  const {
    userAuth: {
      username: authorUsername,
      profileImg: authorProfileImg,
      jwtToken,
    },
  } = useContext(UserContext);

  const {
    seen,
    type,
    reply,
    comment,
    repliedOnComment,
    createdAt,
    user,
    user: {
      personalInfo: { fullname, username, profileImg },
    },
    blog: { _id, blogId, title },
    _id: notificationId,
  } = data;

  const {
    notifications,
    notifications: { results, totalDocs },
    setNotifications,
  } = notificationState;

  const handleReply = () => {
    setIsReplying((prevValue) => !prevValue);
  };

  const handleDelete = async (commentId, type, target) => {
    target.setAttribute("disabled", true);

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`,
        { _id: commentId },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (type === "comment") {
        results.splice(index, 1);
      } else {
        delete results[index].reply;
      }

      target.removeAttribute("disabled");

      setNotifications({
        ...notifications,
        results,
        totalDocs: totalDocs - 1,
        deletedDocCount: notifications.deletedDocCount + 1,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`p-6 border-b border-grey border-l-black ${
        !seen ? "border-l-2" : ""
      }`}
    >
      <div className="flex gap-5 mb-3">
        <img
          src={profileImg}
          alt="User profile"
          className="w-14 h-14 flex-none rounded-full"
        />
        <div className="w-full">
          <h1 className="font-medium text-xl text-dark-grey">
            <span className="lg:inline-block hidden capitalize">
              {fullname}
            </span>
            <Link
              to={`/user/${username}`}
              className="mx-1 text-black underline"
            >
              @{username}
            </Link>
            <span className="font-normal">
              {type === "like"
                ? "liked your blog"
                : type === "comment"
                ? "commented on"
                : "replied on"}
            </span>
          </h1>

          {type === "reply" ? (
            <div className="p-4 mt-4 rounded-md bg-grey">
              <p>{repliedOnComment.comment}</p>
            </div>
          ) : (
            <Link
              to={`/blog/${blogId}`}
              className="font-medium text-dark-grey hover:underline line-clamp-1"
            >{`"${title}"`}</Link>
          )}
        </div>
      </div>

      {type !== "like" ? (
        <p className="ml-14 pl-5 font-gelasio text-xl my-5">
          {comment.comment}
        </p>
      ) : (
        ""
      )}

      <div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8">
        <p>{getDay(createdAt)}</p>

        {type !== "like" ? (
          <>
            {!reply ? (
              <button
                className="underline hover:text-black"
                onClick={handleReply}
              >
                Reply
              </button>
            ) : (
              ""
            )}
            <button
              className="underline hover:text-black"
              onClick={(e) => handleDelete(comment._id, "comment", e.target)}
            >
              Delete
            </button>
          </>
        ) : (
          ""
        )}
      </div>

      {isReplying ? (
        <div className="mt-8">
          <NotificationCommentField
            _id={_id}
            blogAuthor={user}
            index={index}
            replyingTo={comment._id}
            setReplying={setIsReplying}
            notificationId={notificationId}
            notificationData={notificationState}
          />
        </div>
      ) : (
        ""
      )}

      {reply ? (
        <div className="ml-20 p-5 bg-grey mt-5 rounded-md">
          <div className="flex gap-3 mb-3">
            <img
              src={authorProfileImg}
              alt="author profile"
              className="w-8 h-8 rounded-full"
            />

            <div>
              <h1 className="font-medium text-xl text-dark-grey">
                <Link
                  to={`/user/${authorUsername}`}
                  className="mx-1 text-black underline"
                >
                  @{authorUsername}
                </Link>

                <span className="font-normal">replied to</span>

                <Link
                  to={`/user/${username}`}
                  className="mx-1 text-black underline"
                >
                  @{username}
                </Link>
              </h1>
            </div>
          </div>

          <p className="ml-14 font-gelasio text-xl my-2">{reply.comment}</p>

          <button
            className="underline hover:text-black ml-14 mt-2"
            onClick={(e) => handleDelete(reply._id, "reply", e.target)}
          >
            Delete
          </button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default NotificationCard;
