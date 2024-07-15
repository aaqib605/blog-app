import { useContext } from "react";
import axios from "axios";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import NoDataMessage from "./nodata.component";
import AnimationWrapper from "../common/page-animation";
import CommentCard from "./comment-card.component";

export const fetchComments = async ({
  skipCount = 0,
  blogId,
  setParentCommentsFunc,
  commentsArr = null,
}) => {
  let res;

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_SERVER_DOMAIN}/get-blog-comments`,
      { blogId, skipCount }
    );

    data.forEach((comment) => {
      comment.childrenLevel = 0;
    });

    setParentCommentsFunc((prevValue) => prevValue + data.length);

    if (commentsArr === null) {
      res = { results: data };
    } else {
      res = { results: [...commentsArr, ...data] };
    }

    return res;
  } catch (error) {
    console.log(error);
  }
};

const CommentsContainer = () => {
  const {
    blog,
    blog: {
      _id,
      title,
      comments: { results: commentsArr },
      activity: { totalParentComments },
    },
    setBlog,
    commentsWrapper,
    setCommentsWrapper,
    totalParentCommentsLoaded,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  const loadMoreComments = async () => {
    const newCommentsArr = await fetchComments({
      skipCount: totalParentCommentsLoaded,
      blogId: _id,
      setParentCommentsFunc: setTotalParentCommentsLoaded,
      commentsArr: commentsArr,
    });

    setBlog({ ...blog, comments: newCommentsArr });
  };

  return (
    <div
      className={`max-sm:w-full fixed ${
        commentsWrapper ? "top-0 sm:right-0" : "top-[100%] sm:right-[-100%]"
      } duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto overflow-x-hidden`}
    >
      <div className="relative">
        <h1 className="text-xl font-medium">Comments</h1>
        <p className="text-lg mt-2 w-[70%] text-dark-grey line-clamp-1">
          {title}
        </p>
        <button
          className="absolute top-0 right-0 flex justify-center items-center w-12 h-12 rounded-full bg-grey"
          onClick={() => setCommentsWrapper((prevValue) => !prevValue)}
        >
          <i className="fi fi-br-cross text-2xl mt-1"></i>
        </button>
      </div>

      <hr className="border-grey my-8 w-[120%] -ml-10" />

      <CommentField action="comment" />

      {commentsArr && commentsArr.length ? (
        commentsArr.map((comment, index) => {
          return (
            <AnimationWrapper key={index}>
              <CommentCard
                index={index}
                leftVal={comment.childrenLevel * 4}
                commentData={comment}
              />
            </AnimationWrapper>
          );
        })
      ) : (
        <NoDataMessage message="No comments" />
      )}

      {totalParentComments > totalParentCommentsLoaded ? (
        <button
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
          onClick={loadMoreComments}
        >
          Load More
        </button>
      ) : (
        ""
      )}
    </div>
  );
};

export default CommentsContainer;
