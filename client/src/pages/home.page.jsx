import { useEffect, useState } from "react";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import Loader from "../components/loader.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import NoDataMessage from "../components/nodata.component";
import { buttonRef } from "../components/inpage-navigation.component";
import filterPaginationData from "../common/filter-pagination-data";
import LoadMoreBlogsBtn from "../components/load-more.component";

const HomePage = () => {
  const [latestBlogs, setLatestBlogs] = useState(null);
  const [trendingBlogs, setTrendingBlogs] = useState(null);
  const [pageState, setPageState] = useState("home");

  const categories = [
    "education",
    "technology",
    "science",
    "software",
    "react",
    "web development",
    "health",
    "nutrition",
    "recipes",
    "travel",
    "finance",
    "investing",
    "stock market",
    "artificial intelligence",
    "environment",
    "eco friendly",
    "test filter",
  ];

  const fetchLatestBlogs = async ({ page = 1 }) => {
    try {
      const {
        data: { blogs },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/latest-blogs`,
        { page }
      );

      const formattedData = await filterPaginationData({
        existingBlogs: latestBlogs,
        newFetchedBlogs: blogs,
        page,
        countRoute: "all-latest-blogs-count",
      });

      setLatestBlogs(formattedData);
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

  const filterBlogsByCategory = (e) => {
    const category = e.target.innerText.toLowerCase();

    setLatestBlogs(null);

    if (pageState === category) {
      setPageState("home");
      return;
    }

    setPageState(category);
  };

  const fetchBlogsByCategory = async ({ page = 1 }) => {
    try {
      const {
        data: { blogs },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search-blogs`,
        { tag: pageState, page }
      );

      const formattedData = await filterPaginationData({
        existingBlogs: latestBlogs,
        newFetchedBlogs: blogs,
        page,
        countRoute: "search-blogs-count",
        dataToSend: { tag: pageState },
      });

      setLatestBlogs(formattedData);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    buttonRef.current.click();

    if (pageState === "home") {
      fetchLatestBlogs({ page: 1 });
    } else {
      fetchBlogsByCategory({ page: 1 });
    }

    if (trendingBlogs === null) {
      fetchTrendingBlogs();
    }
  }, [pageState]);

  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        {/* Latest Blogs */}
        <div className="w-full">
          <InPageNavigation
            routes={[pageState, "trending blogs"]}
            defaultHidden={["trending blogs"]}
          >
            <>
              {latestBlogs === null ? (
                <Loader />
              ) : latestBlogs.results.length ? (
                latestBlogs.results.map((blog, index) => {
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
              ) : (
                <NoDataMessage message={"No blogs published."} />
              )}

              <LoadMoreBlogsBtn
                state={latestBlogs}
                fetchDataFunction={
                  pageState === "home" ? fetchLatestBlogs : fetchBlogsByCategory
                }
              />
            </>

            {trendingBlogs === null ? (
              <Loader />
            ) : trendingBlogs.length ? (
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
            ) : (
              <NoDataMessage message={"No trending blogs available."} />
            )}
          </InPageNavigation>
        </div>

        {/* Filters and Trending Blogs */}
        <div className="min-w[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
          <div className="flex flex-col gap-10">
            <div>
              <h1 className="font-medium text-xl mb-8">
                Stories from all interests
              </h1>

              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => {
                  return (
                    <button
                      className={`tag ${
                        pageState === category ? "bg-black text-white" : ""
                      }`}
                      key={index}
                      onClick={filterBlogsByCategory}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h1 className="font-medium text-xl mb-8">
                Trending <i className="fi fi-rr-arrow-trend-up"></i>
              </h1>

              {trendingBlogs === null ? (
                <Loader />
              ) : trendingBlogs.length ? (
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
              ) : (
                <NoDataMessage message={"No trending blogs available."} />
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
