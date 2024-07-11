import { useParams } from "react-router-dom";

const BlogPage = () => {
  const { blogId } = useParams();

  return <div>View blog with title {blogId}</div>;
};

export default BlogPage;
