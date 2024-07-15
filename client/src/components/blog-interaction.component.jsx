import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { BlogContext } from "../pages/blog.page";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
  const {
    blog,
    blog: {
      _id,
      title,
      blogId,
      activity,
      author: {
        personalInfo: { username: authorUsername },
      },
    },
    setBlog,
    isLikedByUser,
    setIsLikedByUser,
    setCommentsWrapper,
  } = useContext(BlogContext);

  let {
    activity: { totalLikes, totalComments },
  } = blog;

  const {
    userAuth: { username, jwtToken },
  } = useContext(UserContext);

  const handleLike = async () => {
    try {
      if (jwtToken) {
        setIsLikedByUser((prevState) => !prevState);

        !isLikedByUser ? totalLikes++ : totalLikes--;

        setBlog({ ...blog, activity: { ...activity, totalLikes } });

        const { data } = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/like-blog`,
          { _id, isLikedByUser },
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );
      } else {
        toast.error("Please login to like this blog post");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const hasUserLiked = async () => {
      try {
        if (jwtToken) {
          const {
            data: { result },
          } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/liked-by-user`,
            { _id },
            {
              headers: {
                Authorization: `Bearer ${jwtToken}`,
              },
            }
          );

          setIsLikedByUser(Boolean(result));
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    };

    hasUserLiked();
  }, []);

  return (
    <>
      <Toaster />
      <hr className="border-grey my-2" />

      <div className="flex gap-6 justify-between">
        <div className="flex gap-3 items-center">
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80"
            } `}
            onClick={handleLike}
          >
            <i
              className={`fi ${isLikedByUser ? "fi-sr-heart" : "fi-rr-heart"}`}
            ></i>
          </button>
          <p className="text-xl text-dark-grey">{totalLikes}</p>

          <button
            className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
            onClick={() => setCommentsWrapper((prevValue) => !prevValue)}
          >
            <i className="fi fi-rr-comment-dots"></i>
          </button>
          <p className="text-xl text-dark-grey">{totalComments}</p>
        </div>

        <div className="flex gap-6 items-center">
          {username === authorUsername ? (
            <Link
              to={`/editor/${blogId}`}
              className="underline hover:text-purple"
            >
              Edit
            </Link>
          ) : (
            ""
          )}

          <Link
            to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}
          >
            <i className="fi fi-brands-twitter hover:text-twitter"></i>
          </Link>
        </div>
      </div>

      <hr className="border-grey my-2" />
    </>
  );
};

export default BlogInteraction;
