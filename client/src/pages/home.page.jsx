import { useEffect, useState } from "react";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";

const HomePage = () => {
  const [blogs, setBlogs] = useState(null);

  const fetchLatestBlogs = async () => {
    try {
      const {
        data: { blogs },
      } = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/latest-blogs`);

      setBlogs(blogs);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchLatestBlogs();
  }, []);

  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        {/* Latest Blogs */}
        <div className="w-full">
          <InPageNavigation
            routes={["home", "trending blogs"]}
            defaultHidden={["trending blogs"]}
          >
            <>
              {blogs === null ? (
                <Loader />
              ) : (
                blogs.map((blog, index) => <h1 key={index}>{blog.title}</h1>)
              )}
            </>
          </InPageNavigation>
        </div>

        {/* Filters and Trending Blogs */}
        <div></div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
