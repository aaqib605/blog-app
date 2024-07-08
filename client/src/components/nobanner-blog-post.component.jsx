import { Link } from "react-router-dom";
import { getDay } from "../common/date";

const MinimalBlogPost = ({ blog, index }) => {
  const {
    title,
    blogId: id,
    author: {
      personalInfo: { fullname, username, profileImg },
    },
    publishedAt,
  } = blog;
  return (
    <Link to={`/blog/${id}`} className="flex gap-5 mb-8">
      <h1 className="blog-index">{index < 10 ? `0${index + 1}` : index + 1}</h1>

      <div>
        <div className="flex gap-2 items-center mb-7">
          <img
            src={profileImg}
            alt="User profile"
            className="w-6 h-6 rounded-full"
          />
          <p className="line-clamp-1">
            {fullname} @{username}
          </p>
          <p className="min-w-fit">{getDay(publishedAt)}</p>
        </div>

        <h1 className="blog-title">{title}</h1>
      </div>
    </Link>
  );
};

export default MinimalBlogPost;
