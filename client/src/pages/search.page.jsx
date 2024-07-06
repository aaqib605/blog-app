import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import AnimationWrapper from "../common/page-animation";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreBlogsBtn from "../components/load-more.component";

const SearchPage = () => {
  const [blogs, setBlogs] = useState(null);
  const { query } = useParams();

  const searchBlogs = async ({ page = 1, createNewArr = false }) => {
    try {
      const {
        data: { blogs: newFetchedBlogs },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search-blogs`,
        { query, page }
      );

      const formattedData = await filterPaginationData({
        existingBlogs: blogs,
        newFetchedBlogs,
        page,
        countRoute: "search-blogs-count",
        dataToSend: { query },
        createNewArr,
      });

      setBlogs(formattedData);
    } catch (err) {
      console.log(err);
    }
  };

  const resetState = () => {
    setBlogs(null);
  };

  useEffect(() => {
    resetState();
    searchBlogs({ page: 1, createNewArr: true });
  }, [query]);

  return (
    <section className="h-cover flex justify-center gap-10">
      <div className="w-full">
        <InPageNavigation
          routes={[`Search results for "${query}"`, "Accounts matched"]}
          defaultHidden={["Accounts matched"]}
        >
          <>
            {blogs === null ? (
              <Loader />
            ) : blogs.results.length ? (
              blogs.results.map((blog, index) => {
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

            <LoadMoreBlogsBtn state={blogs} fetchDataFunction={searchBlogs} />
          </>
        </InPageNavigation>
      </div>
    </section>
  );
};

export default SearchPage;
