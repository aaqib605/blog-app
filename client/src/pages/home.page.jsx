import { useEffect, useState } from "react";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import Loader from "../components/loader.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";

const HomePage = () => {
  const [latestBlogs, setLatestBlogs] = useState(null);
  const [trendingBlogs, setTrendingBlogs] = useState(null);

  const fetchLatestBlogs = async () => {
    try {
      const {
        data: { blogs },
      } = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/latest-blogs`);

      setLatestBlogs(blogs);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTrendingBlogs = async () => {
    try {
      const {
        data: { blogs },
      } = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/trending-blogs`
      );

      setTrendingBlogs(blogs);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchLatestBlogs();
    fetchTrendingBlogs();
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
            {latestBlogs === null ? (
              <Loader />
            ) : (
              latestBlogs.map((blog, index) => {
                return (
                  <AnimationWrapper
                    key={index}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  >
                    <BlogPostCard
                      blog={blog}
                      author={blog.author.personalInfo}
                    />
                  </AnimationWrapper>
                );
              })
            )}

            {trendingBlogs === null ? (
              <Loader />
            ) : (
              trendingBlogs.map((blog, index) => {
                return (
                  <AnimationWrapper
                    key={index}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  >
                    <MinimalBlogPost blog={blog} index={index} />
                  </AnimationWrapper>
                );
              })
            )}
          </InPageNavigation>
        </div>

        {/* Filters and Trending Blogs */}
        <div></div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
